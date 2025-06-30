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
      throw error;
    }
  }, []);

  const consume = useCallback(async (producerId: string, userId: string) => {
    if (!socketRef.current || !stateRef.current.recvTransport) return;

    const { rtpCapabilities } = stateRef.current.device!;

    return new Promise<MediaStream>((resolve, reject) => {
      socketRef.current!.emit(
        "consume",
        {
          producerId,
          rtpCapabilities,
        },
        async (response: {
          ok: boolean;
          params: {
            id: string;
            producerId: string;
            kind: types.MediaKind;
            rtpParameters: types.RtpParameters;
          };
        }) => {
          if (!response.ok) {
            reject(new Error("Failed to consume"));
            return;
          }

          const consumer = await stateRef.current.recvTransport!.consume({
            id: response.params.id,
            producerId: response.params.producerId,
            kind: response.params.kind,
            rtpParameters: response.params.rtpParameters,
          });

          stateRef.current.consumers.set(consumer.id, consumer);

          const stream = new MediaStream([consumer.track]);
          setParticipants((prev) =>
            prev.map((p) => (p.userId === userId ? { ...p, stream } : p))
          );

          resolve(stream);
        }
      );
    });
  }, []);

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
              await device.load({ routerRtpCapabilities: rtpCapabilities });
              stateRef.current.device = device;
              console.log(`[useMediasoup] Device loaded successfully`);

              // Initialize transports
              console.log(`[useMediasoup] Initializing transports...`);
              await initializeTransports();
              console.log(`[useMediasoup] Transports initialized successfully`);

              // Add existing participants
              setParticipants(participants);

              setIsConnected(true);
              console.log(
                `[useMediasoup] Connection process completed successfully`
              );
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
        setParticipants((prev) => [...prev, { socketId, userId, isHost }]);
      });

      socketRef.current.on("user-left", ({ socketId }) => {
        console.log(`[useMediasoup] User left: ${socketId}`);
        setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
      });
    } catch (err) {
      console.error(`[useMediasoup] Failed to connect:`, err);
      setError(err instanceof Error ? err.message : "Failed to connect");
      throw err;
    }
  }, [roomId, userId, initializeTransports]);

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
