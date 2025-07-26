import { Hono } from "hono";
import { z } from "zod";
import { db } from "@call/db";
import {
  calls,
  callInvitations,
  notifications,
  user as userTable,
  callParticipants,
} from "@call/db/schema";
import { eq, inArray, desc, and } from "drizzle-orm";
import type { ReqVariables } from "../../index.js";

const callsRoutes = new Hono<{ Variables: ReqVariables }>();

const createCallSchema = z.object({
  name: z.string().min(1),
  members: z.array(z.string().email()).optional(),
  teamId: z.string().optional(),
});

function generateCallCode() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

callsRoutes.post("/create", async (c) => {
  console.log("🔍 [CALLS DEBUG] POST /create called");

  // Get authenticated user (like teams does)
  const user = c.get("user");
  console.log("👤 [CALLS DEBUG] User:", { id: user?.id, email: user?.email });

  if (!user || !user.id) {
    console.log("❌ [CALLS DEBUG] No user found - returning 401");
    return c.json({ message: "Unauthorized" }, 401);
  }

  let body;
  try {
    body = await c.req.json();
    console.log("📝 [CALLS DEBUG] Request body:", body);
  } catch (e) {
    console.error("❌ [CALLS DEBUG] JSON parse error:", e);
    return c.json({ message: "Invalid JSON body" }, 400);
  }

  // Validate input
  const parse = createCallSchema.safeParse(body);
  if (!parse.success) {
    console.log("❌ [CALLS DEBUG] Validation error:", parse.error.errors);
    return c.json(
      { message: parse.error.errors[0]?.message || "Invalid input" },
      400
    );
  }
  const { name, members } = parse.data;
  console.log("✅ [CALLS DEBUG] Validated data:", { name, members });

  // Find users by email (like teams does)
  console.log("🔍 [CALLS DEBUG] Finding users by email:", members);
  const users = await db
    .select()
    .from(userTable)
    .where(inArray(userTable.email, members || []));
  console.log("👥 [CALLS DEBUG] Found users:", users.length);
  const emailToUserId = new Map(users.map((u) => [u.email, u.id]));

  // Generate unique call ID
  console.log("🔑 [CALLS DEBUG] Generating call ID...");
  let callId;
  let exists = true;
  while (exists) {
    callId = generateCallCode();
    const found = await db.select().from(calls).where(eq(calls.id, callId));
    exists = found.length > 0;
  }
  console.log("✅ [CALLS DEBUG] Generated call ID:", callId);

  // Insert call
  console.log("💾 [CALLS DEBUG] Inserting call into database...");
  try {
    await db.insert(calls).values({
      id: callId as string,
      name,
      creatorId: user.id as string,
      createdAt: new Date(),
    });
    console.log("✅ [CALLS DEBUG] Call inserted successfully");
  } catch (error) {
    console.error("❌ [CALLS DEBUG] Error inserting call:", error);
    throw error;
  }

  // Insert invitations and notifications
  console.log("📧 [CALLS DEBUG] Creating invitations and notifications...");
  try {
    for (const email of members || []) {
      const inviteeId = emailToUserId.get(email);
      console.log(
        `📨 [CALLS DEBUG] Processing invitation for ${email}, inviteeId: ${inviteeId}`
      );

      const invitationData: any = {
        id: crypto.randomUUID(),
        callId,
        inviteeEmail: email,
        status: "pending",
        createdAt: new Date(),
      };
      if (inviteeId) invitationData.inviteeId = inviteeId;

      await db.insert(callInvitations).values(invitationData);
      console.log(`✅ [CALLS DEBUG] Invitation created for ${email}`);

      if (inviteeId) {
        const notificationMessage = body.teamId
          ? `${user.name || user.email} started a meeting in team: ${name}`
          : `${user.name || user.email} is inviting you to a call: ${name}`;

        await db.insert(notifications).values({
          id: crypto.randomUUID(),
          userId: inviteeId,
          message: notificationMessage,
          callId,
          createdAt: new Date(),
        });
        console.log(`✅ [CALLS DEBUG] Notification created for ${email}`);
      }
    }
    console.log("✅ [CALLS DEBUG] All invitations and notifications created");
  } catch (error) {
    console.error(
      "❌ [CALLS DEBUG] Error creating invitations/notifications:",
      error
    );
    throw error;
  }

  console.log("🎉 [CALLS DEBUG] Call created successfully:", callId);
  return c.json({ callId });
});

callsRoutes.patch("/invitations/:id/accept", async (c) => {
  const invitationId = c.req.param("id");
  if (!invitationId) return c.json({ error: "Missing invitation id" }, 400);

  const [invitation] = await db
    .select()
    .from(callInvitations)
    .where(eq(callInvitations.id, invitationId));
  if (!invitation) return c.json({ error: "Invitation not found" }, 404);
  if (invitation.status !== "pending")
    return c.json({ error: "Already handled" }, 400);

  await db
    .update(callInvitations)
    .set({ status: "accepted" })
    .where(eq(callInvitations.id, invitationId));

  return c.json({ callId: invitation.callId });
});

callsRoutes.patch("/invitations/:id/reject", async (c) => {
  const invitationId = c.req.param("id");
  if (!invitationId) return c.json({ error: "Missing invitation id" }, 400);

  const [invitation] = await db
    .select()
    .from(callInvitations)
    .where(eq(callInvitations.id, invitationId));
  if (!invitation) return c.json({ error: "Invitation not found" }, 404);
  if (invitation.status !== "pending")
    return c.json({ error: "Already handled" }, 400);

  await db
    .update(callInvitations)
    .set({ status: "rejected" })
    .where(eq(callInvitations.id, invitationId));

  return c.json({ message: "Invitation rejected" });
});

// GET /api/calls/participated
callsRoutes.get("/participated", async (c) => {
  try {
    const user = c.get("user");
    if (!user || !user.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get all calls where user was a participant
    const participatedCalls = await db
      .select({
        id: calls.id,
        name: calls.name,
        creatorId: calls.creatorId,
        joinedAt: callParticipants.joinedAt,
        leftAt: callParticipants.leftAt,
      })
      .from(callParticipants)
      .innerJoin(calls, eq(callParticipants.callId, calls.id))
      .where(eq(callParticipants.userId, user.id as string))
      .orderBy(desc(callParticipants.joinedAt));

    return c.json({ calls: participatedCalls });
  } catch (error) {
    console.error("Error fetching participated calls:", error);
    return c.json({ error: "Failed to fetch call history" }, 500);
  }
});

// POST /api/calls/record-participation
callsRoutes.post("/record-participation", async (c) => {
  try {
    const user = c.get("user");
    if (!user || !user.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const { callId } = body;

    if (!callId) {
      return c.json({ error: "Call ID is required" }, 400);
    }

    // Check if call exists
    const call = await db.query.calls.findFirst({
      where: eq(calls.id, callId),
    });

    if (!call) {
      return c.json({ error: "Call not found" }, 404);
    }

    // Record participation (ignore if already recorded)
    await db
      .insert(callParticipants)
      .values({
        callId,
        userId: user.id as string,
      })
      .onConflictDoNothing();

    return c.json({ success: true });
  } catch (error) {
    console.error("Error recording call participation:", error);
    return c.json({ error: "Failed to record participation" }, 500);
  }
});

// POST /api/calls/record-leave
callsRoutes.post("/record-leave", async (c) => {
  try {
    const user = c.get("user");
    if (!user || !user.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const { callId } = body;

    if (!callId) {
      return c.json({ error: "Call ID is required" }, 400);
    }

    // Update the leftAt timestamp for the user's participation record
    await db
      .update(callParticipants)
      .set({ leftAt: new Date() })
      .where(
        eq(callParticipants.callId, callId) && 
        eq(callParticipants.userId, user.id as string)
      );

    return c.json({ success: true });
  } catch (error) {
    console.error("Error recording call leave:", error);
    return c.json({ error: "Failed to record leave time" }, 500);
  }
});

// GET /api/calls/:id/check-access
callsRoutes.get("/:id/check-access", async (c) => {
  try {
    const callId = c.req.param("id");
    const user = c.get("user");
    
    if (!user || !user.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check if call exists
    const callResult = await db
      .select({
        id: calls.id,
        name: calls.name,
        creatorId: calls.creatorId,
        createdAt: calls.createdAt,
      })
      .from(calls)
      .where(eq(calls.id, callId))
      .limit(1);

    if (!callResult || callResult.length === 0) {
      return c.json({ 
        exists: false, 
        error: "Call not found" 
      }, 404);
    }

    const call = callResult[0];
    if (!call) {
      return c.json({ 
        exists: false, 
        error: "Call not found" 
      }, 404);
    }

    // Get creator information
    const creatorResult = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
      })
      .from(userTable)
      .where(eq(userTable.id, call.creatorId))
      .limit(1);

    const creator = creatorResult.length > 0 ? creatorResult[0] : null;

    // Check if user is the creator
    if (call.creatorId === user.id) {
      return c.json({
        exists: true,
        hasAccess: true,
        isCreator: true,
        call: {
          id: call.id,
          name: call.name,
          createdAt: call.createdAt,
          creator: creator,
        },
      });
    }

    // Check if user has been invited
    const invitationResult = await db
      .select()
      .from(callInvitations)
      .where(
        and(
          eq(callInvitations.callId, callId),
          eq(callInvitations.inviteeId, user.id as string)
        )
      )
      .limit(1);

    const invitation = invitationResult.length > 0 ? invitationResult[0] : null;
    if (invitation && invitation.status === "accepted") {
      return c.json({
        exists: true,
        hasAccess: true,
        isCreator: false,
        isInvited: true,
        call: {
          id: call.id,
          name: call.name,
          createdAt: call.createdAt,
          creator: creator,
        },
      });
    }

    // User is not invited - needs permission
    return c.json({
      exists: true,
      hasAccess: false,
      isCreator: false,
      isInvited: false,
      needsPermission: true,
      call: {
        id: call.id,
        name: call.name,
        createdAt: call.createdAt,
        creator: creator,
      },
    });

  } catch (error) {
    console.error("Error checking call access:", error);
    return c.json({ error: "Failed to check access" }, 500);
  }
});

// POST /api/calls/:id/request-join
callsRoutes.post("/:id/request-join", async (c) => {
  try {
    const callId = c.req.param("id");
    const user = c.get("user");
    
    if (!user || !user.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check if call exists
    const callResult = await db
      .select({
        id: calls.id,
        name: calls.name,
        creatorId: calls.creatorId,
      })
      .from(calls)
      .where(eq(calls.id, callId))
      .limit(1);

    if (!callResult || callResult.length === 0) {
      return c.json({ error: "Call not found" }, 404);
    }

    const call = callResult[0];
    if (!call) {
      return c.json({ error: "Call not found" }, 404);
    }

    // Check if there's already a pending request from this user
    const existingNotification = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.callId, callId),
          eq(notifications.userId, call.creatorId)
        )
      )
      .limit(1);

    // Delete existing notification if any to avoid duplicates
    if (existingNotification.length > 0) {
      await db
        .delete(notifications)
        .where(
          and(
            eq(notifications.callId, callId),
            eq(notifications.userId, call.creatorId)
          )
        );
    }

    // Create notification for the creator with requester info embedded
    const notificationId = crypto.randomUUID();
    await db.insert(notifications).values({
      id: notificationId,
      userId: call.creatorId,
      message: `${user.name || user.email}:${user.id} wants to join your call: ${call.name}`,
      callId: callId,
      createdAt: new Date(),
    });

    return c.json({ 
      success: true, 
      message: "Join request sent to call creator",
      requestId: notificationId,
    });

  } catch (error) {
    console.error("Error requesting to join call:", error);
    return c.json({ error: "Failed to send join request" }, 500);
  }
});

// POST /api/calls/:id/approve-join
callsRoutes.post("/:id/approve-join", async (c) => {
  try {
    const callId = c.req.param("id");
    const user = c.get("user");
    const body = await c.req.json();
    const { requesterId } = body;
    
    if (!user || !user.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check if user is the creator
    const callResult = await db
      .select({ creatorId: calls.creatorId })
      .from(calls)
      .where(eq(calls.id, callId))
      .limit(1);

    if (!callResult || callResult.length === 0) {
      return c.json({ error: "Call not found" }, 404);
    }

    const call = callResult[0];
    if (!call || call.creatorId !== user.id) {
      return c.json({ error: "Only call creator can approve join requests" }, 403);
    }

    // Get requester information
    const requesterResult = await db
      .select({
        id: userTable.id,
        email: userTable.email,
      })
      .from(userTable)
      .where(eq(userTable.id, requesterId))
      .limit(1);

    if (!requesterResult || requesterResult.length === 0) {
      return c.json({ error: "Requester not found" }, 404);
    }

    const requester = requesterResult[0];
    if (!requester) {
      return c.json({ error: "Requester not found" }, 404);
    }

    // Create invitation for the requester
    await db.insert(callInvitations).values({
      id: crypto.randomUUID(),
      callId: callId,
      inviteeId: requesterId,
      inviteeEmail: requester.email,
      status: "accepted",
      createdAt: new Date(),
    });

    // Delete the notification request
    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.callId, callId),
          eq(notifications.userId, call.creatorId)
        )
      );

    return c.json({ 
      success: true, 
      message: "User approved to join call" 
    });

  } catch (error) {
    console.error("Error approving join request:", error);
    return c.json({ error: "Failed to approve join request" }, 500);
  }
});

// GET /api/calls/:id/join-requests
callsRoutes.get("/:id/join-requests", async (c) => {
  try {
    const callId = c.req.param("id");
    const user = c.get("user");
    
    if (!user || !user.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check if user is the creator
    const callResult = await db
      .select({ creatorId: calls.creatorId })
      .from(calls)
      .where(eq(calls.id, callId))
      .limit(1);

    if (!callResult || callResult.length === 0) {
      return c.json({ error: "Call not found" }, 404);
    }

    const call = callResult[0];
    if (!call || call.creatorId !== user.id) {
      return c.json({ error: "Only call creator can view join requests" }, 403);
    }

    // Get pending join requests from notifications
    const requests = await db
      .select({
        id: notifications.id,
        message: notifications.message,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(
        and(
          eq(notifications.callId, callId),
          eq(notifications.userId, call.creatorId)
        )
      )
      .orderBy(desc(notifications.createdAt));

    // Extract requester info from notifications
    const joinRequests = await Promise.all(
      requests
        .filter(req => req.message.includes("wants to join"))
        .map(async (req) => {
          // Extract requester info from message format: "Name:userId wants to join..."
          const match = req.message.match(/^(.+?):([^:]+) wants to join/);
          if (!match) return null;

          const [, requesterName, requesterId] = match;
          if (!requesterId) return null;
          
          // Get requester email
          const requesterInfo = await db
            .select({ email: userTable.email })
            .from(userTable)
            .where(eq(userTable.id, requesterId))
            .limit(1);

          return {
            id: req.id,
            userId: requesterId,
            userName: requesterName,
            userEmail: requesterInfo.length > 0 ? requesterInfo[0]?.email || "" : "",
            timestamp: req.createdAt,
          };
        })
    );

    // Filter out null values
    const validRequests = joinRequests.filter(req => req !== null);

    return c.json({ requests: validRequests });

  } catch (error) {
    console.error("Error fetching join requests:", error);
    return c.json({ error: "Failed to fetch join requests" }, 500);
  }
});

// POST /api/calls/:id/reject-join
callsRoutes.post("/:id/reject-join", async (c) => {
  try {
    const callId = c.req.param("id");
    const user = c.get("user");
    const body = await c.req.json();
    const { requestId } = body;
    
    if (!user || !user.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check if user is the creator
    const callResult = await db
      .select({ creatorId: calls.creatorId })
      .from(calls)
      .where(eq(calls.id, callId))
      .limit(1);

    if (!callResult || callResult.length === 0) {
      return c.json({ error: "Call not found" }, 404);
    }

    const call = callResult[0];
    if (!call || call.creatorId !== user.id) {
      return c.json({ error: "Only call creator can reject join requests" }, 403);
    }

    // Delete the notification (request)
    await db
      .delete(notifications)
      .where(eq(notifications.id, requestId));

    return c.json({ 
      success: true, 
      message: "Join request rejected" 
    });

  } catch (error) {
    console.error("Error rejecting join request:", error);
    return c.json({ error: "Failed to reject join request" }, 500);
  }
});

export default callsRoutes;
