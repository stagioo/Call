import { Hono } from "hono";
import { z } from "zod";
import { db } from "@call/db";
import {
  calls,
  callInvitations,
  notifications,
  user as userTable,
} from "@call/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { initMediasoup, createRouterForCall } from "../../config/mediasoup.js";
import { getRouter } from "../../config/mediasoup.js";
import type { ReqVariables } from "../../index.js";

const callsRoutes = new Hono<{ Variables: ReqVariables }>();

const createCallSchema = z.object({
  name: z.string().min(1),
  members: z.array(z.string().email()).min(1),
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
    .where(inArray(userTable.email, members));
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
    for (const email of members) {
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
        await db.insert(notifications).values({
          id: crypto.randomUUID(),
          userId: inviteeId,
          message: `${user.name || user.email} hes inviting you to a call: ${name}`,
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


  try {
    await createRouterForCall(callId!);
    console.log("✅ [CALLS DEBUG] Router created for call");
  } catch (error) {
    console.error("❌ [CALLS DEBUG] Error creating router:", error);
    // Don't throw error, just log it
    console.log("⚠️ [CALLS DEBUG] Continuing without router...");
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

callsRoutes.get("/:id/router-capabilities", async (c) => {
  const callId = c.req.param("id");
  if (!callId) return c.json({ error: "Missing call id" }, 400);

  const router = await getRouter(callId);
  if (!router) return c.json({ error: "Router not found" }, 404);

  // FIX: responde como objeto con la propiedad rtpCapabilities
  return c.json({ rtpCapabilities: router.rtpCapabilities });
});

callsRoutes.post("/:id/join", async (c) => {
  const callId = c.req.param("id");
  if (!callId) return c.json({ error: "Missing call id" }, 400);

  const { rtpCapabilities } = await c.req.json();
  if (!rtpCapabilities)
    return c.json({ error: "Missing rtpCapabilities" }, 400);

  // Get authenticated user (like teams does)
  const user = c.get("user");
  if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

  const [call] = await db.select().from(calls).where(eq(calls.id, callId));
  if (!call) return c.json({ error: "Call not found" }, 404);

  const invited =
    call.creatorId === user.id ||
    (
      await db
        .select()
        .from(callInvitations)
        .where(
          and(
            eq(callInvitations.callId, callId),
            eq(callInvitations.inviteeId, user.id)
          )
        )
    ).length > 0;
  if (!invited) return c.json({ error: "Not invited" }, 403);

  const router = await getRouter(callId);
  if (!router) return c.json({ error: "Router not found" }, 404);

  const sendTransport = await router.createWebRtcTransport({
    listenIps: [{ ip: "0.0.0.0", announcedIp: null }], // TODO: set announcedIp if behind NAT
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    enableSctp: false,
    initialAvailableOutgoingBitrate: 800000,
  });

  const recvTransport = await router.createWebRtcTransport({
    listenIps: [{ ip: "0.0.0.0", announcedIp: null }],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    enableSctp: false,
    initialAvailableOutgoingBitrate: 800000,
  });

  return c.json({
    sendTransport: {
      id: sendTransport.id,
      iceParameters: sendTransport.iceParameters,
      iceCandidates: sendTransport.iceCandidates,
      dtlsParameters: sendTransport.dtlsParameters,
    },
    recvTransport: {
      id: recvTransport.id,
      iceParameters: recvTransport.iceParameters,
      iceCandidates: recvTransport.iceCandidates,
      dtlsParameters: recvTransport.dtlsParameters,
    },
  });
});

export default callsRoutes;
