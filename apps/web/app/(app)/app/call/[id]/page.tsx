"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import type { Device } from "mediasoup-client";
import * as Select from "@radix-ui/react-select";
import { Button } from "@call/ui/components/button";

interface MediaDevice {
  deviceId: string;
  label: string;
}

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
  const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDevice[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [producerTransport, setProducerTransport] = useState<any>(null);

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
            setError("Call not found");
          } else {
            setError("Error getting RTP capabilities");
          }
          return;
        }
        const data = await res.json();
        if (!data.rtpCapabilities) {
          setError("Invalid server response");
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


  useEffect(() => {
    let stream: MediaStream | null = null;
    setMediaError(null);
    const getDevicesAndMedia = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videos = devices.filter((d) => d.kind === "videoinput").map((d) => ({ deviceId: d.deviceId, label: d.label || `Cámara (${d.deviceId.slice(-4)})` }));
        const audios = devices.filter((d) => d.kind === "audioinput").map((d) => ({ deviceId: d.deviceId, label: d.label || `Micrófono (${d.deviceId.slice(-4)})` }));
        setVideoDevices(videos);
        setAudioDevices(audios);
    
        setSelectedVideo((prev) => prev || (videos[0]?.deviceId ?? null));
        setSelectedAudio((prev) => prev || (audios[0]?.deviceId ?? null));
 
        if (videos[0] || audios[0]) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: videos[0] ? { deviceId: { exact: videos[0].deviceId } } : false,
            audio: audios[0] ? { deviceId: { exact: audios[0].deviceId } } : false,
          });
          setLocalStream(stream);
        }
      } catch (err: any) {
        if (err && err.name === "NotAllowedError") {
          setMediaError("Permission denied to access camera or microphone");
        } else {
          setMediaError("Could not access camera or microphone");
        }
      }
    };
    getDevicesAndMedia();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };

  }, []);


  useEffect(() => {
    let stream: MediaStream | null = null;
    if (!selectedVideo && !selectedAudio) return;
    const getMedia = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: selectedVideo ? { deviceId: { exact: selectedVideo } } : false,
          audio: selectedAudio ? { deviceId: { exact: selectedAudio } } : false,
        });
        setLocalStream(stream);
      } catch (err: any) {
        setMediaError("Could not access the selected device");
      }
    };
    getMedia();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [selectedVideo, selectedAudio]);

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const handleJoinCall = async () => {
    if (!device || !localStream || joinLoading) return;
    setJoinLoading(true);
    setJoinError(null);
    try {
      
      const res = await fetch(`http://localhost:1284/api/calls/${callId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rtpCapabilities: device.rtpCapabilities }),
      });
      if (!res.ok) {
        if (res.status === 401) setJoinError("No autorizado");
        else if (res.status === 404) setJoinError("Call not found");
        else setJoinError("Error joining the call");
        setJoinLoading(false);
        return;
      }
      const data = await res.json();
      if (!data.transportOptions) {
        setJoinError("Invalid server response");
        setJoinLoading(false);
        return;
      }
      // 2. Create Producer Transport in mediasoup-client
      const sendTransport = device.createSendTransport(data.transportOptions);
      setProducerTransport(sendTransport);
      // 3. Connect transport events
      sendTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
        try {
          const res = await fetch(`http://localhost:1284/api/calls/${callId}/connect-transport`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ transportId: sendTransport.id, dtlsParameters }),
          });
          if (!res.ok) throw new Error("Error connecting transport");
          callback();
        } catch (err) {
          errback(err instanceof Error ? err : new Error(String(err)));
        }
      });
      sendTransport.on("produce", async ({ kind, rtpParameters }, callback, errback) => {
        try {
          const res = await fetch(`http://localhost:1284/api/calls/${callId}/produce`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              transportId: sendTransport.id,
              kind,
              rtpParameters,
            }),
          });
          const { id } = await res.json();
          callback({ id });
        } catch (err) {
          errback(err instanceof Error ? err : new Error(String(err)));
        }
      });
      // 4. Produce audio and video
      for (const track of localStream.getTracks()) {
        await sendTransport.produce({ track });
      }
      setJoined(true);
    } catch (err: any) {
      setJoinError(err.message || "Unexpected error joining the call");
    } finally {
      setJoinLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!session?.user) {
    // Redirecting in progress
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
      {/* Eliminado: Mostrar rtpCapabilities en la UI */}
      {device && (
        <div className="mt-2 text-green-600">Mediasoup Device initialized successfully.</div>
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
        <div className="mt-2 text-xs text-muted-foreground">Preview of your camera and microphone</div>
        <div className="flex gap-4 mt-4 w-full max-w-xs">
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">Camera</label>
            <Select.Root value={selectedVideo ?? undefined} onValueChange={setSelectedVideo}>
              <Select.Trigger className="w-full border rounded px-2 py-1 bg-background text-sm">
                <Select.Value placeholder="Select camera" />
              </Select.Trigger>
              <Select.Content className="bg-background border rounded shadow-md z-50">
                {videoDevices.length === 0 ? (
                  <div className="px-2 py-1 text-muted-foreground text-sm">No cameras</div>
                ) : (
                  videoDevices.filter((d) => d.deviceId).map((d) => (
                    <Select.Item key={d.deviceId} value={d.deviceId} className="px-2 py-1 cursor-pointer">
                      {d.label || 'Unnamed camera'}
                    </Select.Item>
                  ))
                )}
              </Select.Content>
            </Select.Root>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">Microphone</label>
            <Select.Root value={selectedAudio ?? undefined} onValueChange={setSelectedAudio}>
              <Select.Trigger className="w-full border rounded px-2 py-1 bg-background text-sm">
                <Select.Value placeholder="Select microphone" />
              </Select.Trigger>
              <Select.Content className="bg-background border rounded shadow-md z-50">
                {audioDevices.length === 0 ? (
                  <div className="px-2 py-1 text-muted-foreground text-sm">No microphones</div>
                ) : (
                  audioDevices.filter((d) => d.deviceId).map((d) => (
                    <Select.Item key={d.deviceId} value={d.deviceId} className="px-2 py-1 cursor-pointer">
                      {d.label || 'Unnamed microphone'}
                    </Select.Item>
                  ))
                )}
              </Select.Content>
            </Select.Root>
          </div>
        </div>
        <Button
          className="mt-6 w-full max-w-xs"
          onClick={handleJoinCall}
          disabled={joinLoading || joined || !device || !localStream}
        >
          {joinLoading ? "Joining..." : joined ? "You have joined the call!" : "Join the call"}
        </Button>
        {joinError && <div className="text-red-500 mt-2 text-sm">{joinError}</div>}
        {joined && <div className="text-green-600 mt-2 text-sm">You have joined the call!</div>}
      </div>
    </div>
  );
} 