import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import { handleWebRtcRequest } from "./utils/webrtc-handler";

interface RoomParticipant {
  socketId: string;
  userId: string;
  isHost: boolean;
}

interface Room {
  participants: Map<string, RoomParticipant>;
  hostId?: string;
}

export class WebSocketServer {
  private io: SocketIOServer;
  private rooms: Map<string, Room> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on("connection", (socket) => {
      console.log(`User connected: ${socket.id}`);

      // Join room
      socket.on(
        "join-room",
        async (data: { roomId: string; userId: string }) => {
          const { roomId, userId } = data;

          // Join socket room
          socket.join(roomId);

          // Get or create room
          if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, { participants: new Map() });
          }

          const room = this.rooms.get(roomId)!;
          const isHost = room.participants.size === 0;

          // Add participant
          room.participants.set(socket.id, {
            socketId: socket.id,
            userId,
            isHost,
          });

          if (isHost) {
            room.hostId = socket.id;
          }

          // Initialize WebRTC for this peer
          try {
            const rtpCapabilities = await handleWebRtcRequest(
              socket,
              roomId,
              userId
            );

            // Notify others in the room
            socket.to(roomId).emit("user-joined", {
              socketId: socket.id,
              userId,
              isHost,
            });

            // Send current participants to the new user
            const participants = Array.from(room.participants.values()).filter(
              (p) => p.socketId !== socket.id
            );

            socket.emit("room-joined", {
              participants,
              rtpCapabilities,
            });

            console.log(
              `User ${userId} joined room ${roomId} as ${isHost ? "host" : "participant"}`
            );
          } catch (error) {
            console.error("Failed to initialize WebRTC:", error);
            socket.emit("error", { message: "Failed to join room" });
            socket.disconnect();
          }
        }
      );

      // Disconnect
      socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);

        // Find and remove from all rooms
        for (const [roomId, room] of this.rooms.entries()) {
          if (room.participants.has(socket.id)) {
            room.participants.delete(socket.id);

            // Notify others
            socket.to(roomId).emit("user-left", { socketId: socket.id });

            // If room is empty, remove it
            if (room.participants.size === 0) {
              this.rooms.delete(roomId);
              console.log(`Room ${roomId} deleted (empty)`);
            }

            break;
          }
        }
      });
    });
  }

  public getIO() {
    return this.io;
  }
}

// Remove the auto-initialization
// new WebSocketServer();
