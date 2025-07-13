import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";

const PORT = 3005;
const server = createServer();
const wss = new WebSocketServer({ server });

// Map<roomId, Set<ws>>
const rooms = new Map<string, Set<WebSocket>>();

wss.on("connection", (ws: WebSocket) => {
  let currentRoom: string | null = null;
  console.log("[WS] Nueva conexión establecida");

  ws.on("message", (message: string) => {
    console.log("[WS] Mensaje recibido:", message);
    try {
      const data = JSON.parse(message.toString());
      if (data.type === "join" && data.roomId && data.userId) {
        currentRoom = data.roomId;
        if (currentRoom) {
          if (!rooms.has(currentRoom)) rooms.set(currentRoom, new Set());
          rooms.get(currentRoom)!.add(ws);
          console.log(
            `[WS] Usuario ${data.userId} se unió a la sala: ${currentRoom}`
          );
          // Notificar a los demás usuarios de la sala
          rooms.get(currentRoom)?.forEach((client) => {
            if (client !== ws && client.readyState === 1) {
              client.send(
                JSON.stringify({ type: "user-joined", userId: data.userId })
              );
            }
          });
        }
      } else if (data.type === "signal" && currentRoom) {
        // Broadcast signaling data to all peers in the room except sender
        console.log(`[WS] Broadcast signal en sala ${currentRoom}`);
        rooms.get(currentRoom)?.forEach((client) => {
          if (client !== ws && client.readyState === 1) {
            client.send(JSON.stringify({ type: "signal", data: data.data }));
          }
        });
      }
    } catch (e) {
      console.error("[WS] Error parseando mensaje:", e);
    }
  });

  ws.on("close", () => {
    console.log(`[WS] Conexión cerrada. Sala: ${currentRoom}`);
    if (currentRoom && rooms.has(currentRoom)) {
      rooms.get(currentRoom)!.delete(ws);
      if (rooms.get(currentRoom)!.size === 0) rooms.delete(currentRoom);
    }
  });
});

server.listen(PORT, () => {
  console.log(`WebSocket signaling server running on ws://localhost:${PORT}`);
});
