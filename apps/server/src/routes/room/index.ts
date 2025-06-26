import { zValidator } from "@hono/zod-validator";
import { createRoomSchema } from "@/validators";
import type { Context } from "hono";
import { Hono } from "hono";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { schema } from "@call/db";

const roomRouter = new Hono();

roomRouter.post(
  "/create",
  zValidator("json", createRoomSchema),
  async (c: Context) => {
    try {
      const { name } = await c.req.json();
      const db = c.get("db");

      if (!db) {
        return c.json(
          {
            success: false,
            message: "Database connection not available.",
          },
          500
        );
      }

      const joinCode = nanoid(8).toUpperCase();

      const [newRoom] = await db
        .insert(schema.room)
        .values({
          id: nanoid(),
          name,
          joinCode,
          requireAccessBeforeJoining: false,
        })
        .returning();

      return c.json({
        success: true,
        message: "Room created successfully",
        room: {
          id: newRoom.id,
          name: newRoom.name,
          joinCode: newRoom.joinCode,
          createdAt: newRoom.createdAt,
        },
      });
    } catch (err) {
      console.error("Error creating room:", err);
      return c.json(
        {
          success: false,
          message: "Unexpected error occurred while creating room.",
        },
        500
      );
    }
  }
);

roomRouter.get("/:roomId", async (c: Context) => {
  try {
    const roomId = c.req.param("roomId");
    const db = c.get("db");

    if (!db) {
      return c.json(
        {
          success: false,
          message: "Database connection not available.",
        },
        500
      );
    }

    const rooms = await db
      .select()
      .from(schema.room)
      .where(eq(schema.room.id, roomId))
      .limit(1);

    if (rooms.length === 0) {
      return c.json(
        {
          success: false,
          message: "Room not found.",
        },
        404
      );
    }

    return c.json({
      success: true,
      room: {
        id: rooms[0].id,
        name: rooms[0].name,
        joinCode: rooms[0].joinCode,
        createdAt: rooms[0].createdAt,
      },
    });
  } catch (err) {
    console.error("Error fetching room:", err);
    return c.json(
      {
        success: false,
        message: "Unexpected error occurred while fetching room.",
      },
      500
    );
  }
});

export default roomRouter;
