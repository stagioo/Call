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
    connected,
    socket,
    deviceRef,
    createRecvTransport: createRecv,
  } = useMediasoupClient();

  // Estado local para remote consumers
  const [remoteVideos, setRemoteVideos] = useState<{ id: string, stream: MediaStream }[]>([]);
  const [remoteAudios, setRemoteAudios] = useState<{ id: string, stream: MediaStream }[]>([]);
  const [recvTransportReady, setRecvTransportReady] = useState(false);
  const consumedProducers = useRef<Set<string>>(new Set());
  const [producers, setProducers] = useState<any[]>([]);
  const [myProducerIds, setMyProducerIds] = useState<string[]>([]);

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
    // 2. Obtener capacidades RTP del router remoto
    const rtpCapabilities = (joinRes as any).rtpCapabilities || (joinRes as any).routerRtpCapabilities;
    if (!rtpCapabilities) {
      alert('No se recibieron capacidades RTP del router');
      return;
    }
    setProducers((joinRes as any).producers || []);
    // 3. Cargar el device de mediasoup
    await loadDevice(rtpCapabilities);
    // 4. Crear el transporte de envío y recepción
    await createSendTransport();
    await createRecv();
    setRecvTransportReady(true);
    // 5. Obtener el stream local con los dispositivos seleccionados
    let stream: MediaStream;
    try {
      if (previewStream) {
        stream = previewStream;
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      }
      if (!stream.getTracks().length) {
        alert('No se detectaron tracks de audio/video en el stream local. Revisa permisos y dispositivos.');
        console.error('Stream local vacío:', stream);
        return;
      }
    } catch (err) {
      alert('Error accediendo a la cámara/micrófono. Revisa permisos.');
      console.error('Error getUserMedia:', err);
      return;
    }
    // 6. Producir el stream local y guardar los ids
    const myProducers = await produce(stream);
    if (!myProducers || !myProducers.length) {
      alert('No se pudo producir audio/video. Revisa consola para más detalles.');
      console.error('Producers vacíos:', myProducers);
      return;
    }
    setMyProducerIds(myProducers.map((p: any) => p.id));
    setJoined(true);
  };

  // Consumir producers existentes al entrar a la llamada (solo después de que el device y el recv transport estén listos)
  useEffect(() => {
    if (!joined || !producers.length || !deviceRef.current || !recvTransportReady) return;
    producers.forEach((producer) => {
      if (!consumedProducers.current.has(producer.id) && !myProducerIds.includes(producer.id)) {
        consumedProducers.current.add(producer.id);
        consume(producer.id, deviceRef.current!.rtpCapabilities, (stream: MediaStream, kind?: string) => {
          if (!stream) return;
          if (kind === 'video' && stream.getVideoTracks().length > 0) {
            setRemoteVideos((prev) => prev.find(v => v.id === stream.id) ? prev : [...prev, { id: stream.id, stream }]);
          }
          if (kind === 'audio' && stream.getAudioTracks().length > 0) {
            setRemoteAudios((prev) => prev.find(a => a.id === stream.id) ? prev : [...prev, { id: stream.id, stream }]);
          }
          console.log('Consuming producer', producer.id, 'kind:', kind, 'stream:', stream);
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined, producers, deviceRef.current, myProducerIds, recvTransportReady]);

  // Escuchar nuevos producers en tiempo real
  useEffect(() => {
    if (!joined || !socket || !deviceRef.current || !recvTransportReady) return;
    const handler = (event: MessageEvent) => {
      try {
        // Log para depuración
        console.log('[WebSocket] Mensaje recibido:', event.data);
        const data = JSON.parse(event.data);
        if (data.type === 'newProducer' && data.id) {
          if (!consumedProducers.current.has(data.id) && !myProducerIds.includes(data.id)) {
            consumedProducers.current.add(data.id);
            // Log para depuración
            console.log('[WebSocket] Nuevo producer detectado:', data.id, data.kind);
            consume(data.id, deviceRef.current!.rtpCapabilities, (stream: MediaStream, kind?: string) => {
              if (!stream) return;
              // LOGS DETALLADOS DE TRACKS
              console.log('[DEBUG] Remote stream kind:', kind);
              console.log('[DEBUG] Remote stream tracks:', stream.getTracks());
              console.log('[DEBUG] Remote video tracks:', stream.getVideoTracks());
              console.log('[DEBUG] Remote audio tracks:', stream.getAudioTracks());
              if (kind === 'video' && stream.getVideoTracks().length > 0) {
                setRemoteVideos((prev) => prev.find(v => v.id === stream.id) ? prev : [...prev, { id: stream.id, stream }]);
              }
              if (kind === 'audio' && stream.getAudioTracks().length > 0) {
                setRemoteAudios((prev) => prev.find(a => a.id === stream.id) ? prev : [...prev, { id: stream.id, stream }]);
              }
              console.log('[WebSocket] Consumiendo nuevo producer', data.id, 'kind:', kind, 'stream:', stream);
            });
          }
        }
      } catch (err) {
        console.error('[WebSocket] Error procesando mensaje:', err);
      }
    };
    socket.addEventListener('message', handler);
    return () => {
      socket.removeEventListener('message', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined, socket, deviceRef.current, myProducerIds, recvTransportReady]);

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
                ref={el => {
                  if (el && localStream) {
                    el.srcObject = localStream;
                    el.onloadedmetadata = () => {
                      el.play().catch(e => console.warn('Error forcing play:', e));
                    };
                  }
                }}
              />
            )}
            {/* Videos remotos */}
            {remoteVideos.map(({ id, stream }) => (
              <video
                key={id}
                autoPlay
                playsInline
                muted={false}
                className="rounded-lg shadow-lg w-[320px] h-[240px] bg-black"
                ref={el => {
                  if (el) {
                    el.srcObject = stream;
                    // Forzar play y loguear estado del track
                    const videoTrack = stream.getVideoTracks()[0];
                    if (videoTrack) {
                      console.log('[DEBUG] Remote video track enabled:', videoTrack.enabled, 'readyState:', videoTrack.readyState, 'muted:', videoTrack.muted);
                    }
                    el.onloadedmetadata = () => {
                      el.play().catch(e => console.warn('Error forcing play:', e));
                    };
                  }
                }}
              />
            ))}
            {/* Audios remotos */}
            {remoteAudios.map(({ id, stream }) => (
              <audio
                key={id + '-audio'}
                autoPlay
                controls={false}
                ref={el => { if (el) el.srcObject = stream; }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 