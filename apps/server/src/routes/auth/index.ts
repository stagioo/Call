import { zValidator } from "@hono/zod-validator";
import { emailSchema } from "@/validators";
import { user } from "@call/db/schema";
import { auth } from "@call/auth/auth";
import type { Context } from "hono";
import { eq } from "drizzle-orm";
import { db } from "@call/db";
import { Hono } from "hono";

const authRouter = new Hono();

authRouter.post(
  "/check-email",
  zValidator("json", emailSchema),
  async (c: Context) => {
    try {
      const { email } = await c.req.json<{ email: string }>();

      const existingUser = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, email.toLowerCase().trim()))
        .limit(1);

      return c.json({ exists: existingUser.length > 0 });
    } catch (error) {
      console.error("Error checking email:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  }
);

authRouter.on(["POST", "GET"], "/*", async (c: Context) => {
  try {
    return await auth.handler(c.req.raw);
  } catch (error) {
    console.error("Auth handler error:", error);
    return c.json({ error: "Authentication failed" }, 500);
  }
});

export default authRouter;
