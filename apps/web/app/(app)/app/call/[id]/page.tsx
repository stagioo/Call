"use client";
import { useEffect, useState, useRef } from "react";
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
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  // Captura y previsualización del stream local
  useEffect(() => {
    let stream: MediaStream | null = null;
    setMediaError(null);
    const getMedia = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
      } catch (err: any) {
        if (err && err.name === "NotAllowedError") {
          setMediaError("Permiso denegado para acceder a la cámara o micrófono");
        } else {
          setMediaError("No se pudo acceder a la cámara o micrófono");
        }
      }
    };
    getMedia();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Asignar el stream al elemento <video>
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

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
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-2xl font-bold mb-2">Call Room</h1>
      <p className="mb-4 text-muted-foreground">Call ID: {callId}</p>
      {rtpCapabilities && (
        <pre className="bg-muted p-2 rounded text-xs mt-2 overflow-x-auto max-w-xl">
          {JSON.stringify(rtpCapabilities, null, 2)}
        </pre>
      )}
      {device && (
        <div className="mt-2 text-green-600">Mediasoup Device inicializado correctamente.</div>
      )}
      <div className="mt-8 flex flex-col items-center">
        {mediaError ? (
          <div className="text-red-500 font-medium">{mediaError}</div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="rounded-lg border border-gray-300 shadow-md w-[320px] h-[240px] bg-black object-cover"
          />
        )}
        <div className="mt-2 text-xs text-muted-foreground">Previsualización de tu cámara y micrófono</div>
      </div>
    </div>
  );
} 