"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import type { Device } from "mediasoup-client";

export default function CallRoomPage() {
  const params = useParams();
  const router = useRouter();
  const callId = params?.id;
  const { session, isLoading } = useSession();
  const [rtpCapabilities, setRtpCapabilities] = useState<any>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !session?.user) {
      router.replace("/login");
    }
  }, [isLoading, session, router]);

  useEffect(() => {
    if (!callId || !session?.user) return;
    let cancelled = false;
    const fetchCapabilities = async () => {
      setError(null);
      setRtpCapabilities(null);
      setDevice(null);
      try {
        const res = await fetch(`http://localhost:1284/api/calls/${callId}/router-capabilities`, {
          credentials: "include",
        });
        if (!res.ok) {
          if (res.status === 404) {
            setError("Llamada no encontrada");
          } else {
            setError("Error obteniendo capacidades RTP");
          }
          return;
        }
        const data = await res.json();
        if (!data.rtpCapabilities) {
          setError("Respuesta inválida del servidor");
          return;
        }
        setRtpCapabilities(data.rtpCapabilities);
        // Dynamic import mediasoup-client for SSR safety
        const { Device } = await import("mediasoup-client");
        const dev = new Device();
        await dev.load({ routerRtpCapabilities: data.rtpCapabilities });
        if (!cancelled) setDevice(dev);
      } catch (err: any) {
        setError(err.message || "Error de red");
      }
    };
    fetchCapabilities();
    return () => {
      cancelled = true;
    };
  }, [callId, session?.user]);

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!session?.user) {
    // Redirección en curso
    return null;
  }

  if (error) {
    return (
      <div className="flex h-32 items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Call Room</h1>
      <p>Call ID: {callId}</p>
      {rtpCapabilities && (
        <pre className="bg-muted p-2 rounded text-xs mt-4 overflow-x-auto">
          {JSON.stringify(rtpCapabilities, null, 2)}
        </pre>
      )}
      {device && (
        <div className="mt-2 text-green-600">Mediasoup Device inicializado correctamente.</div>
      )}
    </div>
  );
} 