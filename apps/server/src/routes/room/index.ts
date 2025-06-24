import { zValidator } from "@hono/zod-validator";
import { createRoomSchema } from "@/validators";
import type { Context } from "hono";
import { Hono } from "hono";

const roomRouter = new Hono();

roomRouter.post(
  "/send-mail",
  zValidator("json", createRoomSchema),
  async (c: Context) => {
    try {
      const { name, joinCode, requireAccessBeforeJoining } = await c.req.json();

      console.log({ name, joinCode, requireAccessBeforeJoining });
    } catch (err) {
      console.error("Unexpected error sending email:", err);
      return c.json(
        {
          success: false,
          message: "Unexpected error occurred.",
        },
        500
      );
    }
  }
);

export default roomRouter;
