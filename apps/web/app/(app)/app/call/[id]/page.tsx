'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useMediasoupClient } from '@/hooks/useMediasoupClient';

export default function CallPreviewPage() {
  const params = useParams();
  const callId = params?.id as string;
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | undefined>();
  const [selectedAudio, setSelectedAudio] = useState<string | undefined>();
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [joined, setJoined] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Mediasoup hooks
  const {
    joinRoom,
    loadDevice,
    createSendTransport,
    createRecvTransport,
    produce,
    consume,
    localStream,
    remoteStreams,
    connected,
    socket,
    deviceRef,
  } = useMediasoupClient();

  // Guardar producers existentes al hacer joinRoom
  const [producers, setProducers] = useState<any[]>([]);

  // Obtener dispositivos disponibles
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      setVideoDevices(devices.filter((d) => d.kind === 'videoinput'));
      setAudioDevices(devices.filter((d) => d.kind === 'audioinput'));
    });
  }, []);

  // Obtener stream con los dispositivos seleccionados para previsualización
  useEffect(() => {
    let active = true;
    const getStream = async () => {
      try {
        const constraints: MediaStreamConstraints = {
          video: selectedVideo ? { deviceId: { exact: selectedVideo } } : true,
          audio: selectedAudio ? { deviceId: { exact: selectedAudio } } : true,
        };
        const s = await navigator.mediaDevices.getUserMedia(constraints);
        if (active) setPreviewStream(s);
      } catch {
        if (active) setPreviewStream(null);
      }
    };
    getStream();
    return () => {
      active = false;
      previewStream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVideo, selectedAudio]);

  // Asignar stream al video de previsualización
  useEffect(() => {
    if (videoRef.current && previewStream) {
      videoRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  // Lógica para unirse a la llamada
  const handleJoin = async () => {
    if (!callId) return;
    // 1. Unirse a la sala en el backend
    const joinRes = await joinRoom(callId);
    // 2. Obtener capacidades RTP del router remoto (soportar diferentes nombres de campo)
    const rtpCapabilities = (joinRes as any).rtpCapabilities || (joinRes as any).routerRtpCapabilities;
    if (!rtpCapabilities) {
      alert('No se recibieron capacidades RTP del router');
      return;
    }
    // Guardar producers existentes
    setProducers((joinRes as any).producers || []);
    // 3. Cargar el device de mediasoup
    await loadDevice(rtpCapabilities);
    // 4. Crear el transporte de envío y recepción
    await createSendTransport();
    await createRecvTransport();
    // 5. Obtener el stream local con los dispositivos seleccionados
    let stream: MediaStream;
    if (previewStream) {
      stream = previewStream;
    } else {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    }
    // 6. Producir el stream local
    await produce(stream);
    setJoined(true);
  };

  // Consumir producers existentes al entrar a la llamada
  useEffect(() => {
    if (!joined || !producers.length || !deviceRef.current) return;
    producers.forEach((producer) => {
      consume(producer.id, deviceRef.current!.rtpCapabilities, undefined);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined, producers, deviceRef.current]);

  // Escuchar nuevos producers en tiempo real
  useEffect(() => {
    if (!joined || !socket || !deviceRef.current) return;
    const handler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'newProducer' && data.id) {
          consume(data.id, deviceRef.current!.rtpCapabilities, undefined);
        }
      } catch {}
    };
    socket.addEventListener('message', handler);
    return () => {
      socket.removeEventListener('message', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined, socket, deviceRef.current]);

  // TODO: Para tiempo real total, deberías escuchar nuevos producers vía signaling (ej: broadcast a todos los usuarios cuando alguien produce)

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
      {!joined ? (
        <>
          <div className="w-full max-w-xs flex flex-col gap-4">
            <label className="font-semibold">Cámara</label>
            <select
              className="border rounded px-2 py-1"
              value={selectedVideo}
              onChange={e => setSelectedVideo(e.target.value)}
            >
              <option value="">Seleccionar cámara</option>
              {videoDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || `Cámara (${d.deviceId})`}</option>
              ))}
            </select>
            <label className="font-semibold mt-2">Micrófono</label>
            <select
              className="border rounded px-2 py-1"
              value={selectedAudio}
              onChange={e => setSelectedAudio(e.target.value)}
            >
              <option value="">Seleccionar micrófono</option>
              {audioDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || `Micrófono (${d.deviceId})`}</option>
              ))}
            </select>
          </div>
          <div className="rounded-lg shadow-lg overflow-hidden bg-black w-[320px] h-[240px] flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
          <button
            className="mt-4 px-6 py-2 rounded bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
            onClick={handleJoin}
            disabled={!connected}
          >
            {connected ? 'Unirse a la llamada' : 'Conectando...'}
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="text-lg font-semibold">En llamada</div>
          <div className="flex flex-wrap gap-4 justify-center w-full">
            {/* Video local */}
            {localStream && (
              <video
                autoPlay
                playsInline
                muted
                className="rounded-lg shadow-lg w-[320px] h-[240px] bg-black"
                ref={el => { if (el) el.srcObject = localStream; }}
              />
            )}
            {/* Videos remotos */}
            {remoteStreams.map((stream, i) => (
              <video
                key={i}
                autoPlay
                playsInline
                className="rounded-lg shadow-lg w-[320px] h-[240px] bg-black"
                ref={el => { if (el) el.srcObject = stream; }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 