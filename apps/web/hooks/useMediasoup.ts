import { useCallback, useEffect, useRef, useState } from "react";
import { Socket, io } from "socket.io-client";
import type { types } from "mediasoup-client";
import { Device } from "mediasoup-client";

interface MediasoupState {
  device: Device | null;
  sendTransport: types.Transport | null;
  recvTransport: types.Transport | null;
  producers: Map<string, types.Producer>;
  consumers: Map<string, types.Consumer>;
}

interface Participant {
  socketId: string;
  userId: string;
  isHost: boolean;
  stream?: MediaStream;
  tracks: Map<string, MediaStreamTrack>; // Track kind -> track
}

export function useMediasoup(roomId: string, userId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const stateRef = useRef<MediasoupState>({
    device: null,
    sendTransport: null,
    recvTransport: null,
    producers: new Map(),
    consumers: new Map(),
  });

  const updateParticipantStream = useCallback(
    (userId: string, track: MediaStreamTrack) => {
      console.log(
        `[useMediasoup] Updating participant ${userId} with ${track.kind} track`
      );

      setParticipants((prev) => {
        const updated = prev.map((p) => {
          if (p.userId === userId) {
            // Update tracks map
            const newTracks = new Map(p.tracks || new Map());
            newTracks.set(track.kind, track);

            // Create new stream with all tracks
            const allTracks = Array.from(newTracks.values());
            const newStream = new MediaStream(allTracks);

            console.log(`[useMediasoup] Updated stream for ${userId}:`, {
              streamId: newStream.id,
              tracks: allTracks.map((t) => ({
                kind: t.kind,
                enabled: t.enabled,
                readyState: t.readyState,
              })),
              active: newStream.active,
            });

            return { ...p, tracks: newTracks, stream: newStream };
          }
          return p;
        });

        return updated;
      });
    },
    []
  );

  const connectTransport = useCallback(
    async (
      transport: types.Transport,
      dtlsParameters: types.DtlsParameters
    ) => {
      if (!socketRef.current) return;

      return new Promise((resolve, reject) => {
        socketRef.current!.emit(
          "connectWebRtcTransport",
          {
            transportId: transport.id,
            dtlsParameters,
          },
          async (response: { ok: boolean }) => {
            if (!response.ok) {
              reject(new Error("Failed to connect transport"));
              return;
            }
            resolve(true);
          }
        );
      });
    },
    []
  );

  const createTransport = useCallback(
    async (producing: boolean, consuming: boolean) => {
      if (!socketRef.current) return null;

      return new Promise<types.Transport>((resolve, reject) => {
        socketRef.current!.emit(
          "createWebRtcTransport",
          { producing, consuming },
          async (response: {
            ok: boolean;
            params: {
              id: string;
              iceParameters: types.IceParameters;
              iceCandidates: types.IceCandidate[];
              dtlsParameters: types.DtlsParameters;
            };
          }) => {
            if (!response.ok) {
              reject(new Error("Failed to create transport"));
              return;
            }

            const transport = producing
              ? stateRef.current.device!.createSendTransport({
                  id: response.params.id,
                  iceParameters: response.params.iceParameters,
                  iceCandidates: response.params.iceCandidates,
                  dtlsParameters: response.params.dtlsParameters,
                })
              : stateRef.current.device!.createRecvTransport({
                  id: response.params.id,
                  iceParameters: response.params.iceParameters,
                  iceCandidates: response.params.iceCandidates,
                  dtlsParameters: response.params.dtlsParameters,
                });

            console.log(
              `[useMediasoup] Created ${producing ? "send" : "recv"} transport:`,
              {
                id: transport.id,
                closed: transport.closed,
                connectionState: transport.connectionState,
              }
            );

            transport.on("connect", ({ dtlsParameters }, callback, errback) => {
              connectTransport(transport, dtlsParameters)
                .then(callback)
                .catch(errback);
            });

            if (producing) {
              transport.on(
                "produce",
                async ({ kind, rtpParameters, appData }, callback, errback) => {
                  try {
                    socketRef.current!.emit(
                      "produce",
                      {
                        transportId: transport.id,
                        kind,
                        rtpParameters,
                        appData,
                      },
                      (response: { ok: boolean; producerId?: string }) => {
                        if (response.ok && response.producerId) {
                          callback({ id: response.producerId });
                        } else {
                          errback(new Error("Failed to produce"));
                        }
                      }
                    );
                  } catch (error) {
                    errback(
                      error instanceof Error
                        ? error
                        : new Error("Failed to produce")
                    );
                  }
                }
              );
            }

            resolve(transport);
          }
        );
      });
    },
    [connectTransport]
  );

  const initializeTransports = useCallback(async () => {
    const sendTransport = await createTransport(true, false);
    const recvTransport = await createTransport(false, true);

    stateRef.current.sendTransport = sendTransport;
    stateRef.current.recvTransport = recvTransport;
  }, [createTransport]);

  const produce = useCallback(async (track: MediaStreamTrack) => {
    if (!stateRef.current.sendTransport) {
      throw new Error("Send transport not available");
    }

    if (!stateRef.current.device) {
      throw new Error("Device not available");
    }

    // Check if device can produce this kind of media
    const canProduce = stateRef.current.device.canProduce(
      track.kind as types.MediaKind
    );
    console.log(`[useMediasoup] Device can produce ${track.kind}:`, canProduce);

    if (!canProduce) {
      console.error(
        `[useMediasoup] Device cannot produce ${track.kind} media.`
      );
      console.error(
        `[useMediasoup] Device RTP capabilities:`,
        stateRef.current.device.rtpCapabilities
      );
      console.error(
        `[useMediasoup] Available ${track.kind} codecs:`,
        stateRef.current.device.rtpCapabilities.codecs?.filter(
          (c) => c.kind === track.kind
        )
      );

      throw new Error(
        `Device cannot produce ${track.kind} media. Available codecs: ${
          stateRef.current.device.rtpCapabilities.codecs
            ?.filter((c) => c.kind === track.kind)
            .map((c) => c.mimeType)
            .join(", ") || "none"
        }`
      );
    }

    console.log(`[useMediasoup] Attempting to produce ${track.kind} track:`, {
      id: track.id,
      kind: track.kind,
      enabled: track.enabled,
      readyState: track.readyState,
      label: track.label,
    });

    try {
      const producer = await stateRef.current.sendTransport.produce({
        track,
        // Only add encodings for video tracks
        ...(track.kind === "video" && {
          encodings: [
            { maxBitrate: 100000 },
            { maxBitrate: 300000 },
            { maxBitrate: 900000 },
          ],
          codecOptions: {
            videoGoogleStartBitrate: 1000,
          },
        }),
      });

      console.log(`[useMediasoup] Successfully produced ${track.kind} track:`, {
        producerId: producer.id,
        kind: producer.kind,
        paused: producer.paused,
      });

      stateRef.current.producers.set(producer.id, producer);
      return producer;
    } catch (error) {
      console.error(
        `[useMediasoup] Failed to produce ${track.kind} track:`,
        error
      );

      if (error instanceof Error) {
        console.error(`[useMediasoup] Error details:`, {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }

      throw error;
    }
  }, []);

  const consume = useCallback(
    async (producerId: string, userId: string) => {
      if (
        !socketRef.current ||
        !stateRef.current.recvTransport ||
        !stateRef.current.device
      ) {
        console.error(`[useMediasoup] Missing requirements for consuming:`, {
          socket: !!socketRef.current,
          recvTransport: !!stateRef.current.recvTransport,
          device: !!stateRef.current.device,
        });
        return null;
      }

      const { rtpCapabilities } = stateRef.current.device;

      console.log(
        `[useMediasoup] Starting consume for producer ${producerId} from user ${userId}`
      );

      return new Promise<MediaStreamTrack | null>((resolve, reject) => {
        socketRef.current!.emit(
          "consume",
          {
            producerId,
            rtpCapabilities,
          },
          async (response: {
            ok: boolean;
            params?: {
              id: string;
              producerId: string;
              kind: types.MediaKind;
              rtpParameters: types.RtpParameters;
              type: string;
              producerPaused: boolean;
            };
          }) => {
            if (!response.ok || !response.params) {
              console.error(
                `[useMediasoup] Failed to consume producer ${producerId}`
              );
              resolve(null);
              return;
            }

            try {
              console.log(
                `[useMediasoup] Creating consumer for producer ${producerId}:`,
                response.params
              );

              const consumer = await stateRef.current.recvTransport!.consume({
                id: response.params.id,
                producerId: response.params.producerId,
                kind: response.params.kind,
                rtpParameters: response.params.rtpParameters,
              });

              console.log(`[useMediasoup] Consumer created:`, {
                consumerId: consumer.id,
                kind: consumer.kind,
                paused: consumer.paused,
                track: {
                  id: consumer.track.id,
                  kind: consumer.track.kind,
                  enabled: consumer.track.enabled,
                  readyState: consumer.track.readyState,
                },
              });

              stateRef.current.consumers.set(consumer.id, consumer);

              // Resume the consumer and wait for it
              console.log(`[useMediasoup] Resuming consumer ${consumer.id}`);
              const resumeResult = await new Promise<boolean>(
                (resumeResolve) => {
                  socketRef.current!.emit(
                    "resumeConsumer",
                    { consumerId: consumer.id },
                    (resumeResponse: { ok: boolean }) => {
                      if (resumeResponse.ok) {
                        console.log(
                          `[useMediasoup] Consumer resumed successfully`
                        );
                        resumeResolve(true);
                      } else {
                        console.error(
                          `[useMediasoup] Failed to resume consumer`
                        );
                        resumeResolve(false);
                      }
                    }
                  );
                }
              );

              if (!resumeResult) {
                console.error(
                  `[useMediasoup] Consumer resume failed, not adding track`
                );
                resolve(null);
                return;
              }

              // Add track to participant
              updateParticipantStream(userId, consumer.track);

              console.log(
                `[useMediasoup] Successfully consumed ${consumer.kind} track for user ${userId}`
              );
              resolve(consumer.track);
            } catch (error) {
              console.error(`[useMediasoup] Error creating consumer:`, error);
              reject(error);
            }
          }
        );
      });
    },
    [updateParticipantStream]
  );

  const consumeExistingProducers = useCallback(async () => {
    if (!socketRef.current) return;

    console.log(`[useMediasoup] Requesting existing producers...`);

    return new Promise<void>((resolve) => {
      socketRef.current!.emit(
        "getProducers",
        async (response: {
          ok: boolean;
          producers?: Array<{
            producerId: string;
            userId: string;
            kind: types.MediaKind;
          }>;
        }) => {
          if (response.ok && response.producers) {
            console.log(
              `[useMediasoup] Found ${response.producers.length} existing producers`
            );

            for (const producer of response.producers) {
              console.log(
                `[useMediasoup] Consuming existing producer:`,
                producer
              );
              try {
                await consume(producer.producerId, producer.userId);
              } catch (error) {
                console.error(
                  `[useMediasoup] Failed to consume existing producer:`,
                  error
                );
              }
            }
          }
          resolve();
        }
      );
    });
  }, [consume]);

  const connect = useCallback(async () => {
    try {
      console.log(
        `[useMediasoup] Starting connection to http://localhost:1284 for room ${roomId}, user ${userId}`
      );

      // Connect to signaling server
      socketRef.current = io("http://localhost:1284", {
        query: { roomId, userId },
      });

      console.log(`[useMediasoup] Socket created, waiting for connection...`);

      // Wait for connection and room join
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Connection timeout after 10 seconds"));
        }, 10000);

        socketRef.current!.on("connect", () => {
          console.log(
            `[useMediasoup] Socket connected successfully, joining room ${roomId}...`
          );
          socketRef.current!.emit("join-room", { roomId, userId });
        });

        socketRef.current!.on("connect_error", (error) => {
          console.error(`[useMediasoup] Socket connection error:`, error);
          clearTimeout(timeout);
          reject(new Error(`Connection failed: ${error.message}`));
        });

        socketRef.current!.on(
          "room-joined",
          async ({ participants, rtpCapabilities }) => {
            try {
              clearTimeout(timeout);
              console.log(
                `[useMediasoup] Room joined successfully, participants:`,
                participants
              );
              console.log(
                `[useMediasoup] RTP capabilities received:`,
                rtpCapabilities
              );

              // Load device
              console.log(`[useMediasoup] Loading mediasoup device...`);
              const device = new Device();

              console.log(`[useMediasoup] Router RTP capabilities:`, {
                codecs: rtpCapabilities.codecs?.map((c: any) => ({
                  kind: c.kind,
                  mimeType: c.mimeType,
                  clockRate: c.clockRate,
                  channels: c.channels,
                  parameters: c.parameters,
                })),
                headerExtensions: rtpCapabilities.headerExtensions?.length,
              });

              await device.load({ routerRtpCapabilities: rtpCapabilities });
              stateRef.current.device = device;

              console.log(
                `[useMediasoup] Device loaded successfully. Capabilities:`,
                {
                  canProduce: {
                    audio: device.canProduce("audio"),
                    video: device.canProduce("video"),
                  },
                  rtpCapabilities: {
                    codecs: device.rtpCapabilities.codecs?.map((c: any) => ({
                      kind: c.kind,
                      mimeType: c.mimeType,
                      clockRate: c.clockRate,
                      channels: c.channels,
                      parameters: c.parameters,
                    })),
                    headerExtensions:
                      device.rtpCapabilities.headerExtensions?.length,
                  },
                  routerCodecs: rtpCapabilities.codecs?.map((c: any) => ({
                    kind: c.kind,
                    mimeType: c.mimeType,
                    clockRate: c.clockRate,
                    channels: c.channels,
                    parameters: c.parameters,
                  })),
                }
              );

              // Debug: Check what codecs are available
              console.log(`[useMediasoup] Detailed codec analysis:`);
              console.log(
                `[useMediasoup] Router video codecs:`,
                rtpCapabilities.codecs?.filter((c: any) => c.kind === "video")
              );
              console.log(
                `[useMediasoup] Device video codecs:`,
                device.rtpCapabilities.codecs?.filter(
                  (c: any) => c.kind === "video"
                )
              );

              // Check if there are any video codecs at all
              const routerVideoCodecs =
                rtpCapabilities.codecs?.filter(
                  (c: any) => c.kind === "video"
                ) || [];
              const deviceVideoCodecs =
                device.rtpCapabilities.codecs?.filter(
                  (c: any) => c.kind === "video"
                ) || [];

              console.log(
                `[useMediasoup] Router has ${routerVideoCodecs.length} video codecs`
              );
              console.log(
                `[useMediasoup] Device has ${deviceVideoCodecs.length} video codecs`
              );

              if (routerVideoCodecs.length === 0) {
                console.error(
                  `[useMediasoup] Router has no video codecs configured!`
                );
              }
              if (deviceVideoCodecs.length === 0) {
                console.error(
                  `[useMediasoup] Device has no video codecs available!`
                );
              }

              // Initialize transports
              console.log(`[useMediasoup] Initializing transports...`);
              await initializeTransports();
              console.log(`[useMediasoup] Transports initialized successfully`);

              // Add existing participants with tracks map
              setParticipants(
                participants.map((p: any) => ({ ...p, tracks: new Map() }))
              );

              setIsConnected(true);
              console.log(
                `[useMediasoup] Connection process completed successfully`
              );

              // Consume existing producers after a short delay to ensure transports are ready
              setTimeout(async () => {
                await consumeExistingProducers();
              }, 1000); // Increased delay

              resolve();
            } catch (err) {
              clearTimeout(timeout);
              console.error(`[useMediasoup] Error during room join:`, err);
              reject(err);
            }
          }
        );

        socketRef.current!.on("error", (error) => {
          console.error(`[useMediasoup] Socket error:`, error);
          clearTimeout(timeout);
          reject(new Error(error.message));
        });
      });

      // Handle participant events
      socketRef.current.on("user-joined", ({ socketId, userId, isHost }) => {
        console.log(`[useMediasoup] New user joined: ${userId} (${socketId})`);
        setParticipants((prev) => [
          ...prev,
          { socketId, userId, isHost, tracks: new Map() },
        ]);
      });

      socketRef.current.on("user-left", ({ socketId }) => {
        console.log(`[useMediasoup] User left: ${socketId}`);
        setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
      });

      // Handle new producers
      socketRef.current.on(
        "newProducer",
        async ({ producerId, userId, kind }) => {
          console.log(`[useMediasoup] New producer available:`, {
            producerId,
            userId,
            kind,
          });
          try {
            await consume(producerId, userId);
          } catch (error) {
            console.error(
              `[useMediasoup] Failed to consume new producer:`,
              error
            );
          }
        }
      );

      // Handle consumer closed
      socketRef.current.on("consumerClosed", ({ consumerId }) => {
        console.log(`[useMediasoup] Consumer closed: ${consumerId}`);
        const consumer = stateRef.current.consumers.get(consumerId);
        if (consumer) {
          consumer.close();
          stateRef.current.consumers.delete(consumerId);

          // Remove track from participant
          const track = consumer.track;
          setParticipants((prev) =>
            prev.map((p) => {
              const newTracks = new Map(p.tracks);
              newTracks.delete(track.kind);
              const allTracks = Array.from(newTracks.values());
              const newStream =
                allTracks.length > 0 ? new MediaStream(allTracks) : undefined;
              return { ...p, tracks: newTracks, stream: newStream };
            })
          );
        }
      });
    } catch (err) {
      console.error(`[useMediasoup] Failed to connect:`, err);
      setError(err instanceof Error ? err.message : "Failed to connect");
      throw err;
    }
  }, [
    roomId,
    userId,
    initializeTransports,
    consume,
    consumeExistingProducers,
    updateParticipantStream,
  ]);

  const disconnect = useCallback(() => {
    // Close all producers
    stateRef.current.producers.forEach((producer) => producer.close());
    stateRef.current.producers.clear();

    // Close all consumers
    stateRef.current.consumers.forEach((consumer) => consumer.close());
    stateRef.current.consumers.clear();

    // Close transports
    if (stateRef.current.sendTransport) {
      stateRef.current.sendTransport.close();
      stateRef.current.sendTransport = null;
    }
    if (stateRef.current.recvTransport) {
      stateRef.current.recvTransport.close();
      stateRef.current.recvTransport = null;
    }

    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsConnected(false);
    setParticipants([]);
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    produce,
    isConnected,
    error,
    participants,
  };
}
