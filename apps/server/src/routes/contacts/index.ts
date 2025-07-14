import { Hono } from "hono";
import { z } from "zod";
import { db } from "@call/db";
import { contactRequests } from "@call/db/schema";
import {user as userTable} from "@call/db/schema"
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";

const contactsRoutes = new Hono();

// Simple email validation schema
const inviteSchema = z.object({
  receiverEmail: z.string().email("Invalid email format")
});

contactsRoutes.post("/invite", async (c) => {
  // Parse and validate input
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ message: "Invalid JSON body" }, 400);
  }
  const result = inviteSchema.safeParse(body);
  if (!result.success) {
    return c.json({ message: result.error.errors[0]?.message || "Invalid input" }, 400);
  }
  const { receiverEmail } = result.data;

  // Simulate senderId (replace with real user ID in production)
  const senderId = "test-sender-id";

  // Check if the receiver exists
  const [receiver] = await db.select().from(userTable).where(eq(userTable.email, receiverEmail));
  const receiverId = receiver ? receiver.id : null;

  // Insert into contact_requests
  await db.insert(contactRequests).values({
    id: createId(),
    senderId,
    receiverEmail,
    receiverId,
    status: "pending",
    createdAt: new Date(),
  });

  return c.json({ message: "Solicitud enviada" });
});

export default contactsRoutes; 