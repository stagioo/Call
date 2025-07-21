'use client';
import { useEffect, useRef, useState } from "react";

const SOCKET_URL = "ws://localhost:4001";

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(SOCKET_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
      console.log("WebSocket connected");
    };

    socket.onclose = () => {
      setConnected(false);
      console.log("WebSocket disconnected");
    };

    socket.onerror = (err) => {
      setConnected(false);
      console.error("WebSocket error", err);
    };

    return () => {
      socket.close();
    };
  }, []);

  return { socket: socketRef.current, connected };
} 