import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";


const SOCKET_URL = "ws://localhost:4001";

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {

    const socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected successfully");
      setConnected(true);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      // Try to reconnect with polling if websocket fails
      const manager = socket.io;
      if (
        manager &&
        manager.opts &&
        manager.opts.transports &&
        manager.opts.transports[0] === "websocket"
      ) {
        console.log("Falling back to polling transport");
        manager.opts.transports = ["polling", "websocket"];
      }
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    return () => {
      console.log("Cleaning up socket connection");
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, []);

  return { socket: socketRef.current, connected };
} 