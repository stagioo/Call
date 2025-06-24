import { zValidator } from "@hono/zod-validator";
import { createRoomSchema } from "@/validators";
import type { Context } from "hono";
import { Hono } from "hono";

const roomRouter = new Hono();

roomRouter.post(
  "/create",
  zValidator("json", createRoomSchema),
  async (c: Context) => {
    try {
      const { name } = await c.req.json();

      return c.json({
        success: true,
        message: "Room created successfully",
      });
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
