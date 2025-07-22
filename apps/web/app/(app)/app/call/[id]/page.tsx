'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useMediasoupClient } from '@/hooks/useMediasoupClient';

function generateUserId() {
  if (typeof window !== 'undefined') {
    let id = localStorage.getItem('user-id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('user-id', id);
    }
    return id;
  }
  return '';
}

const MediaControls = ({ localStream, joined, onHangup, isScreenSharing, onToggleScreenShare }: { 
  localStream: MediaStream | null;
  joined: boolean;
  onHangup: () => void;
  isScreenSharing: boolean;
  onToggleScreenShare: () => void;
}) => {
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  const toggleCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !isCameraOn;
      });
      setIsCameraOn((prev) => !prev);
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMicOn;
      });
      setIsMicOn((prev) => !prev);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-4 rounded-lg z-50">
      <button
        className={`px-4 py-2 rounded ${isCameraOn ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
        onClick={toggleCamera}
      >
        {isCameraOn ? 'Turn off camera' : 'Turn on camera'}
      </button>
      <button
        className={`px-4 py-2 rounded ${isMicOn ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
        onClick={toggleMic}
      >
        {isMicOn ? 'Turn off microphone' : 'Turn on microphone'}
      </button>
      <button
        className={`px-4 py-2 rounded ${isScreenSharing ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}
        onClick={onToggleScreenShare}
      >
        {isScreenSharing ? 'Stop sharing' : 'Share screen'}
      </button>
      <button
        className="px-4 py-2 rounded bg-red-600 text-white"
        onClick={onHangup}
      >
        Hang up
      </button>
    </div>
  );
};

interface RemoteStream {
  id: string;
  stream: MediaStream;
  userId?: string;
  kind?: string;
  producerId?: string;
}

export default function CallPreviewPage() {
  const params = useParams();
  const callId = params?.id as string;
  const userId = generateUserId();
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | undefined>();
  const [selectedAudio, setSelectedAudio] = useState<string | undefined>();
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [joined, setJoined] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenProducerRef = useRef<any>(null);

  // Mediasoup hooks with cleanupAll
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
    device,
  } = useMediasoupClient();

  // Local state for remote consumers
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [remoteAudios, setRemoteAudios] = useState<{ id: string, stream: MediaStream, userId?: string }[]>([]);
  const [recvTransportReady, setRecvTransportReady] = useState(false);
  const consumedProducers = useRef<Set<string>>(new Set());
  const [producers, setProducers] = useState<any[]>([]);
  const [myProducerIds, setMyProducerIds] = useState<string[]>([]);

  // Get available devices
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      setVideoDevices(devices.filter((d) => d.kind === 'videoinput'));
      setAudioDevices(devices.filter((d) => d.kind === 'audioinput'));
    });
  }, []);

  // Get stream with the selected devices for preview
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

// Assign stream to the preview video
  useEffect(() => {
    if (videoRef.current && previewStream) {
      videoRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

 // Logic to join the call
const handleJoin = async () => {
  if (!callId) return;
  // 1. Join the room in the backend
  const joinRes = await joinRoom(callId);
  // 2. Get the RTP capabilities of the remote router
  const rtpCapabilities = (joinRes as any).rtpCapabilities || (joinRes as any).routerRtpCapabilities;
  if (!rtpCapabilities) {
    alert('No RTP capabilities received from the router');
    return;
  }
  setProducers((joinRes as any).producers || []);
  // 3. Load the mediasoup device
  await loadDevice(rtpCapabilities);
  // 4. Create send and receive transports
  await createSendTransport();
  await createRecvTransport();
  setRecvTransportReady(true);
  // 5. Get the local stream with the selected devices
  let stream: MediaStream;
  try {
    if (previewStream) {
      // Ensure we have both audio and video tracks in the preview stream
      const hasAudio = previewStream.getAudioTracks().length > 0;
      const hasVideo = previewStream.getVideoTracks().length > 0;
      
      if (!hasAudio || !hasVideo) {
        // Get a new stream with both audio and video
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: hasVideo ? false : true,
          audio: hasAudio ? false : true
        });
        
        // Combine tracks from both streams
        const combinedStream = new MediaStream();
        
        // Add existing tracks
        previewStream.getTracks().forEach(track => combinedStream.addTrack(track));
        
        // Add new tracks
        stream.getTracks().forEach(track => {
          if ((track.kind === 'audio' && !hasAudio) || (track.kind === 'video' && !hasVideo)) {
            combinedStream.addTrack(track);
          }
        });
        
        stream = combinedStream;
      } else {
        stream = previewStream;
      }
    } else {
      stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
    }
    
    if (!stream.getTracks().length) {
      alert('No audio/video tracks detected in the local stream. Check permissions and devices.');
      console.error('Empty local stream:', stream);
      return;
    }

    // Log tracks for debugging
    console.log('Local stream tracks:', stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, id: t.id })));
    
  } catch (err) {
    alert('Error accessing camera/microphone. Check permissions.');
    console.error('Error getUserMedia:', err);
    return;
  }
  // 6. Produce the local stream and save the IDs
  const myProducers = await produce(stream, { source: 'camera' });
  if (!myProducers || !myProducers.length) {
    alert('Could not produce audio/video. Check console for more details.');
    console.error('Empty producers:', myProducers);
    return;
  }
  setMyProducerIds(myProducers.map((p: any) => p.id));
  setJoined(true);
};

// Handle screen sharing
const handleToggleScreenShare = async () => {
  try {
    if (screenStream) {
      // Stop screen sharing
      screenStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      setScreenStream(null);
      setIsScreenSharing(false);

      // Close screen share producer if exists
      if (screenProducerRef.current && socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'closeProducer',
          producerId: screenProducerRef.current.id
        }));
        screenProducerRef.current = null;
      }
    } else {
      // Start screen sharing
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      // Handle when user stops sharing via browser UI
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          if (screenStream) {
            (screenStream as MediaStream).getTracks().forEach((track: MediaStreamTrack) => track.stop());
          }
          setScreenStream(null);
          setIsScreenSharing(false);
          if (screenProducerRef.current && socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              type: 'closeProducer',
              producerId: screenProducerRef.current.id
            }));
            screenProducerRef.current = null;
          }
        };
      }

      setScreenStream(stream);
      setIsScreenSharing(true);

      // Produce screen sharing stream separately
      if (joined && socket?.readyState === WebSocket.OPEN) {
        const producers = await produce(stream, { source: 'screen' });
        const firstProducer = producers?.[0];
        if (producers && producers.length > 0 && firstProducer && 'id' in firstProducer) {
          screenProducerRef.current = firstProducer;
          setMyProducerIds(prev => [...prev, firstProducer.id]);
        }
      }
    }
  } catch (err) {
    console.error('Error toggling screen share:', err);
    setIsScreenSharing(false);
    setScreenStream(null);
  }
};

// Consume existing producers
useEffect(() => {
  if (!joined || !producers.length || !device || !recvTransportReady) return;
  
  producers.forEach((producer) => {
    if (!consumedProducers.current.has(producer.id) && !myProducerIds.includes(producer.id)) {
      consumedProducers.current.add(producer.id);
      consume(producer.id, device.rtpCapabilities, (stream: MediaStream, kind?: string, remoteUserId?: string) => {
        if (!stream) return;
        
        // Handle video streams (both camera and screen)
        if (kind === 'video') {
          const isScreenShare = producer.appData?.source === 'screen';
          setRemoteStreams(prev => {
            // Remove any existing stream with the same ID
            const filtered = prev.filter(v => v.id !== stream.id);
            return [...filtered, { 
              id: stream.id, 
              stream, 
              userId: remoteUserId,
              kind: isScreenShare ? 'screen' : 'camera'
            }];
          });
        }
        
        // Handle audio streams
        if (kind === 'audio') {
          setRemoteAudios(prev => {
            // Remove any existing audio stream with the same ID
            const filtered = prev.filter(a => a.id !== stream.id);
            // Get audio tracks and create new stream only if we have tracks
            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length === 0) return filtered;
            // Create a new MediaStream with only the audio track
            const audioStream = new MediaStream(audioTracks);
            return [...filtered, { 
              id: stream.id, 
              stream: audioStream, 
              userId: remoteUserId 
            }];
          });
        }
      });
    }
  });
}, [joined, producers, device, myProducerIds, recvTransportReady, consume]);

// Listen for new producers and user disconnections in real-time
useEffect(() => {
  if (!joined || !socket || !device || !recvTransportReady) return;
  
  const handleMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      // Handle new producers
      if (data.type === 'newProducer' && data.id) {
        if (!consumedProducers.current.has(data.id) && !myProducerIds.includes(data.id)) {
          consumedProducers.current.add(data.id);
          consume(data.id, device.rtpCapabilities, (stream: MediaStream, kind?: string, remoteUserId?: string) => {
            if (!stream) return;
            if (kind === 'video') {
              const isScreenShare = data.appData?.source === 'screen';
              setRemoteStreams(prev => prev.find(v => v.id === stream.id) ? prev : [...prev, { 
                id: stream.id, 
                stream, 
                userId: remoteUserId ?? data.userId,
                kind: isScreenShare ? 'screen' : 'camera'
              }]);
            }
            if (kind === 'audio') {
              setRemoteAudios(prev => {
                if (prev.find(a => a.id === stream.id)) return prev;
                // Get audio tracks and create new stream only if we have tracks
                const audioTracks = stream.getAudioTracks();
                if (audioTracks.length === 0) return prev;
                // Create a new MediaStream with only the audio track
                const audioStream = new MediaStream(audioTracks);
                return [...prev, { 
                  id: stream.id, 
                  stream: audioStream, 
                  userId: remoteUserId ?? data.userId 
                }];
              });
            }
          });
        }
      }
      
      // Handle user disconnection
      if (data.type === 'userLeft') {
        console.log('[mediasoup] User left:', data.userId);
        
        // Remove all streams from this user and stop tracks
        setRemoteStreams(prev => {
          // First stop all tracks
          prev.forEach(stream => {
            if (stream.userId === data.userId) {
              stream.stream.getTracks().forEach(track => {
                track.stop();
                track.enabled = false;
              });
            }
          });
          // Then filter out the streams
          return prev.filter(stream => stream.userId !== data.userId);
        });
        
        setRemoteAudios(prev => {
          // First stop all tracks
          prev.forEach(audio => {
            if (audio.userId === data.userId) {
              audio.stream.getTracks().forEach(track => {
                track.stop();
                track.enabled = false;
              });
            }
          });
          // Then filter out the audio streams
          return prev.filter(audio => audio.userId !== data.userId);
        });
        
        // Remove from consumed producers
        producers.forEach(producer => {
          if (producer.userId === data.userId) {
            consumedProducers.current.delete(producer.id);
          }
        });

        // Force a re-render of the streams
        setTimeout(() => {
          setRemoteStreams(prev => [...prev]);
          setRemoteAudios(prev => [...prev]);
        }, 0);
      }
      
      // Handle producer closed
      if (data.type === 'producerClosed') {
        console.log('[mediasoup] Producer closed:', data);
        const producerId = data.producerId;
        
        // Remove the specific stream
        setRemoteStreams(prev => {
          const remainingStreams = prev.filter(stream => stream.producerId !== producerId);
          // Stop tracks for removed stream
          prev.forEach(stream => {
            if (stream.producerId === producerId) {
              stream.stream.getTracks().forEach(track => track.stop());
            }
          });
          return remainingStreams;
        });
        
        setRemoteAudios(prev => {
          const remainingAudios = prev.filter(audio => audio.id !== producerId);
          // Stop tracks for removed audio stream
          prev.forEach(audio => {
            if (audio.id === producerId) {
              audio.stream.getTracks().forEach(track => track.stop());
            }
          });
          return remainingAudios;
        });
        
        // Remove from consumed producers
        consumedProducers.current.delete(producerId);
      }
    } catch (err) {
      console.error('[WebSocket] Error processing message:', err);
    }
  };

  socket.addEventListener('message', handleMessage);
  return () => {
    socket.removeEventListener('message', handleMessage);
  };
}, [joined, socket, device, myProducerIds, recvTransportReady, consume, producers]);

// Handle leaving the call
const handleHangup = useCallback(() => {
  // Stop all tracks in local stream
  if (localStream) {
    localStream.getTracks().forEach(track => {
      track.stop();
      track.enabled = false;
    });
  }

  // Stop screen sharing if active
  if (screenStream) {
    screenStream.getTracks().forEach(track => {
      track.stop();
      track.enabled = false;
    });
    setScreenStream(null);
    setIsScreenSharing(false);
  }

  // Close screen share producer if exists
  if (screenProducerRef.current && socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'closeProducer',
      producerId: screenProducerRef.current.id
    }));
    screenProducerRef.current = null;
  }

  // Notify server that we're leaving
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'leaveRoom',
      roomId: callId,
      userId: userId
    }));
  }

  // Clear all remote videos and audios
  setRemoteStreams(prev => {
    prev.forEach(stream => {
      if (stream.stream) {
        stream.stream.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
      }
    });
    return [];
  });
  
  setRemoteAudios(prev => {
    prev.forEach(audio => {
      if (audio.stream) {
        audio.stream.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
      }
    });
    return [];
  });
  
  // Clear consumed producers set
  consumedProducers.current.clear();
  
  // Reset producer IDs
  setMyProducerIds([]);

  // Reset join state
  setJoined(false);

  // Navigate back to calls page
  window.location.href = '/app/call';
}, [localStream, screenStream, socket, callId, userId]);

// Cleanup when component unmounts or user navigates away
useEffect(() => {
  const cleanup = () => {
    // Stop all tracks in local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    // Stop screen sharing if active
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
    }

    // Notify server that we're leaving
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'leaveRoom',
        roomId: callId,
        userId: userId
      }));
    }

    // Clear all states
    setRemoteStreams([]);
    setRemoteAudios([]);
    consumedProducers.current.clear();
    setMyProducerIds([]);
  };

  // Add beforeunload listener
  window.addEventListener('beforeunload', cleanup);

  // Cleanup function
  return () => {
    window.removeEventListener('beforeunload', cleanup);
    cleanup();
  };
}, [localStream, screenStream, socket, callId, userId]);

// Handle screen sharing cleanup
useEffect(() => {
  if (screenStream) {
    const handleStreamEnded = () => {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
      setIsScreenSharing(false);
      if (screenProducerRef.current && socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'closeProducer',
          producerId: screenProducerRef.current.id
        }));
        screenProducerRef.current = null;
      }
    };

    screenStream.getVideoTracks().forEach(track => {
      track.onended = handleStreamEnded;
    });

    return () => {
      screenStream.getVideoTracks().forEach(track => {
        track.onended = null;
      });
    };
  }
}, [screenStream, socket]);

// Filter remote streams by type and ensure they are active and have valid tracks
const remoteVideoStreams = remoteStreams.filter(
  stream => {
    // Check if stream is valid
    if (!stream?.stream) return false;
    
    // Get video tracks
    const videoTracks = stream.stream.getVideoTracks();
    if (!videoTracks.length) return false;
    
    // Check if any track is valid
    const hasValidTrack = videoTracks.some(track => 
      track.readyState === 'live' && 
      track.enabled
    );
    
    return stream.kind === 'camera' && hasValidTrack;
  }
);

const remoteScreenStreams = remoteStreams.filter(
  stream => {
    // Check if stream is valid
    if (!stream?.stream) return false;
    
    // Get video tracks
    const videoTracks = stream.stream.getVideoTracks();
    if (!videoTracks.length) return false;
    
    // Check if any track is valid
    const hasValidTrack = videoTracks.some(track => 
      track.readyState === 'live' && 
      track.enabled
    );
    
    return stream.kind === 'screen' && hasValidTrack;
  }
);

return (
  <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
    {!joined ? (
      <>
        <div className="w-full max-w-xs flex flex-col gap-4">
          <label className="font-semibold">Camera</label>
          <select
            className="border rounded px-2 py-1"
            value={selectedVideo}
            onChange={e => setSelectedVideo(e.target.value)}
          >
            <option value="">Select camera</option>
            {videoDevices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera (${d.deviceId})`}</option>
            ))}
          </select>
          <label className="font-semibold mt-2">Microphone</label>
          <select
            className="border rounded px-2 py-1"
            value={selectedAudio}
            onChange={e => setSelectedAudio(e.target.value)}
          >
            <option value="">Select microphone</option>
            {audioDevices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone (${d.deviceId})`}</option>
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
          {connected ? 'Join the call' : 'Connecting...'}
        </button>
      </>
    ) : (
      <div className="flex flex-col items-center gap-4 w-full">
        <div className="text-lg font-semibold">In call</div>
        <div className="flex flex-wrap gap-4 justify-center w-full">
          {/* Local video */}
          {localStream && localStream.active && localStream.getVideoTracks().some(track => track.enabled) && (
            <div className="relative">
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
              <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">You ({userId.slice(0, 6)})</span>
            </div>
          )}

          {/* Local screen share */}
          {screenStream && screenStream.active && screenStream.getVideoTracks().some(track => track.enabled) && (
            <div className="relative">
              <video
                autoPlay
                playsInline
                muted
                className="rounded-lg shadow-lg w-[320px] h-[240px] bg-black"
                ref={el => {
                  if (el && screenStream) {
                    el.srcObject = screenStream;
                    el.onloadedmetadata = () => {
                      el.play().catch(e => console.warn('Error forcing play:', e));
                    };
                  }
                }}
              />
              <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">Your screen</span>
            </div>
          )}

          {/* Remote cameras */}
          {remoteVideoStreams.map(({ stream, userId: remoteUserId, id }) => {
            if (!stream?.getVideoTracks().some(track => track.readyState === 'live' && track.enabled)) {
              return null;
            }
            
            return (
              <div className="relative" key={id}>
                <video
                  autoPlay
                  playsInline
                  className="rounded-lg shadow-lg w-[320px] h-[240px] bg-black"
                  ref={el => {
                    if (el) {
                      el.srcObject = stream;
                      // Remove video element if stream becomes invalid
                      el.onended = () => {
                        setRemoteStreams(prev => prev.filter(s => s.id !== id));
                      };
                      el.onloadedmetadata = () => {
                        el.play().catch(e => console.warn('Error forcing play:', e));
                      };
                    }
                  }}
                  onError={() => {
                    // Remove stream on error
                    setRemoteStreams(prev => prev.filter(s => s.id !== id));
                  }}
                />
                <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {remoteUserId ? remoteUserId.slice(0, 6) : 'User'}
                </span>
              </div>
            );
          })}

          {/* Remote screens */}
          {remoteScreenStreams.map(({ stream, userId: remoteUserId, id }) => {
            if (!stream?.getVideoTracks().some(track => track.readyState === 'live' && track.enabled)) {
              return null;
            }
            
            return (
              <div className="relative" key={id}>
                <video
                  autoPlay
                  playsInline
                  className="rounded-lg shadow-lg w-[320px] h-[240px] bg-black"
                  ref={el => {
                    if (el) {
                      el.srcObject = stream;
                      // Remove video element if stream becomes invalid
                      el.onended = () => {
                        setRemoteStreams(prev => prev.filter(s => s.id !== id));
                      };
                      el.onloadedmetadata = () => {
                        el.play().catch(e => console.warn('Error forcing play:', e));
                      };
                    }
                  }}
                  onError={() => {
                    // Remove stream on error
                    setRemoteStreams(prev => prev.filter(s => s.id !== id));
                  }}
                />
                <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {`${remoteUserId ? remoteUserId.slice(0, 6) : 'User'}'s screen`}
                </span>
              </div>
            );
          })}

          {/* Remote audios */}
          {remoteAudios.map(({ stream, id }) => (
            <audio
              key={id}
              autoPlay
              playsInline
              ref={el => {
                if (el) {
                  el.srcObject = stream;
                  el.onloadedmetadata = () => {
                    el.play().catch(e => console.warn('Error forcing play:', e));
                  };
                }
              }}
            />
          ))}
        </div>
        <MediaControls 
          localStream={localStream} 
          joined={joined} 
          onHangup={handleHangup}
          isScreenSharing={isScreenSharing}
          onToggleScreenShare={handleToggleScreenShare}
        />
      </div>
    )}
  </div>
);
}