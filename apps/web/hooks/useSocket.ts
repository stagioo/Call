'use client';
import { useEffect, useRef, useState } from "react";

const SOCKET_URL = "ws://127.0.0.1:4001";

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(SOCKET_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
      console.log("WebSocket connected");
      // Log para depuración
      console.log("[useSocket] Conexión WebSocket abierta a:", SOCKET_URL);
    };

    socket.onclose = () => {
      setConnected(false);
      console.log("WebSocket disconnected");
      // Log para depuración
      console.log("[useSocket] Conexión WebSocket cerrada");
    };

    socket.onerror = (err) => {
      setConnected(false);
      console.error("WebSocket error", err);
      // Log para depuración
      console.error("[useSocket] Error en WebSocket:", err);
    };

    return () => {
      socket.close();
    };
  }, []);

  return { socket: socketRef.current, connected };
} 