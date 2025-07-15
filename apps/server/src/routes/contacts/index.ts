import { Hono } from "hono";
import { z } from "zod";
import { db } from "@call/db";
import { contactRequests } from "@call/db/schema";
import { contacts } from "@call/db/schema";
import { user as userTable } from "@call/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import type { ReqVariables } from "../../index";

const contactsRoutes = new Hono<{ Variables: ReqVariables }>();

// Simple email validation schema
const inviteSchema = z.object({
  receiverEmail: z.string().email("Invalid email format")
});

contactsRoutes.post("/invite", async (c) => {
  // Log start of request
  console.log("[POST /invite] Incoming request");
  let body;
  try {
    body = await c.req.json();
    console.log("[POST /invite] Body:", body);
  } catch (e) {
    console.log("[POST /invite] Invalid JSON body", e);
    return c.json({ message: "Invalid JSON body" }, 400);
  }
  const result = inviteSchema.safeParse(body);
  if (!result.success) {
    console.log("[POST /invite] Invalid input:", result.error.errors);
    return c.json({ message: result.error.errors[0]?.message || "Invalid input" }, 400);
  }
  const { receiverEmail } = result.data;

  // Log user from context
  const user = c.get("user");
  console.log("[POST /invite] user from context:", user);
  if (!user || !user.id) {
    console.log("[POST /invite] Unauthorized: user missing or has no id");
    return c.json({ message: "Unauthorized" }, 401);
  }
  const senderId = user.id;
  console.log("[POST /invite] senderId:", senderId);

  // Look up receiverId by email (if exists)
  const [receiver] = await db.select().from(userTable).where(eq(userTable.email, receiverEmail));
  const receiverId = receiver ? receiver.id : null;
  console.log("[POST /invite] receiverEmail:", receiverEmail, "receiverId:", receiverId);

  try {
    await db.insert(contactRequests).values({
      id: createId(),
      senderId,
      receiverEmail,
      receiverId,
      status: "pending",
      createdAt: new Date(),
    });
    console.log("[POST /invite] Contact request inserted successfully");
    return c.json({ message: "Solicitud enviada" });
  } catch (err) {
    console.log("[POST /invite] Error inserting contact request:", err);
    return c.json({ message: "Error inserting contact request", error: String(err) }, 500);
  }
});

contactsRoutes.get("/requests", async (c) => {
  // Use authenticated user
  const user = c.get("user");
  console.log("[GET /requests] user from context:", user);
  if (!user || !user.id) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  const receiverId = user.id;

  // Query pending requests for this user
  const requests = await db.select().from(contactRequests)
    .where(eq(contactRequests.receiverId, receiverId));

  // Filter only pending requests
  const pending = requests.filter(r => r.status === "pending");

  // Return the list (or empty array)
  return c.json({ requests: pending });
});

contactsRoutes.patch("/requests/:id/accept", async (c) => {
  const requestId = c.req.param("id");
  // Use authenticated user
  const user = c.get("user");
  console.log("[PATCH /requests/:id/accept] user from context:", user);
  if (!user || !user.id) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  const userId = user.id;

  // Find the pending request
  const [request] = await db.select().from(contactRequests)
    .where(eq(contactRequests.id, requestId));

  if (!request || request.status !== "pending") {
    return c.json({ message: "Request not found or already managed" }, 404);
  }

  // Update status to accepted
  await db.update(contactRequests)
    .set({ status: "accepted" })
    .where(eq(contactRequests.id, requestId));

  // Create bidirectional contacts
  await db.insert(contacts).values([
    {
      userId: request.receiverId || userId,
      contactId: request.senderId,
      createdAt: new Date(),
    },
    {
      userId: request.senderId,
      contactId: request.receiverId || userId,
      createdAt: new Date(),
    },
  ]);

  return c.json({ message: "Application accepted" });
});

contactsRoutes.patch("/requests/:id/reject", async (c) => {
  const requestId = c.req.param("id");
  // Use authenticated user
  const user = c.get("user");
  console.log("[PATCH /requests/:id/reject] user from context:", user);
  if (!user || !user.id) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  const userId = user.id;

  // Find the pending request
  const [request] = await db.select().from(contactRequests)
    .where(eq(contactRequests.id, requestId));

  if (!request || request.status !== "pending") {
    return c.json({ message: "Request not found or already managed" }, 404);
  }

  // Update status to rejected
  await db.update(contactRequests)
    .set({ status: "rejected" })
    .where(eq(contactRequests.id, requestId));

  return c.json({ message: "Application rejected" });
});

contactsRoutes.get("/", async (c) => {
  // Use authenticated user
  const user = c.get("user");
  console.log("[GET /contacts] user from context:", user);
  if (!user || !user.id) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  const userId = user.id;

  // Query contacts for this user
  const results = await db
    .select({
      contactId: contacts.contactId,
      createdAt: contacts.createdAt,
      name: userTable.name,
      email: userTable.email,
    })
    .from(contacts)
    .leftJoin(userTable, eq(contacts.contactId, userTable.id))
    .where(eq(contacts.userId, userId));

  return c.json({ contacts: results });
});

export default contactsRoutes; 