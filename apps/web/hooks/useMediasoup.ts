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

export function useMediasoup(roomId: string, userId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<
    { userId: string; stream: MediaStream }[]
  >([]);

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

            transport.on("connect", ({ dtlsParameters }, callback, errback) => {
              connectTransport(transport, dtlsParameters)
                .then(callback)
                .catch(errback);
            });

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
    if (!stateRef.current.sendTransport) return null;

    return new Promise<types.Producer>((resolve, reject) => {
      stateRef.current
        .sendTransport!.produce({
          track,
          encodings: [
            { maxBitrate: 100000 },
            { maxBitrate: 300000 },
            { maxBitrate: 900000 },
          ],
          codecOptions: {
            videoGoogleStartBitrate: 1000,
          },
        })
        .then((producer) => {
          stateRef.current.producers.set(producer.id, producer);
          resolve(producer);
        })
        .catch(reject);
    });
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
          setParticipants((prev) => [...prev, { userId, stream }]);

          resolve(stream);
        }
      );
    });
  }, []);

  const connect = useCallback(async () => {
    try {
      // Connect to signaling server
      socketRef.current = io("http://localhost:1284", {
        query: { roomId, userId },
      });

      // Wait for connection
      await new Promise<void>((resolve) => {
        socketRef.current!.on("connect", () => resolve());
      });

      // Load device
      const device = new Device();
      const { rtpCapabilities } = await new Promise<{
        rtpCapabilities: types.RtpCapabilities;
      }>((resolve) => {
        socketRef.current!.emit(
          "getRouterRtpCapabilities",
          (response: { rtpCapabilities: types.RtpCapabilities }) =>
            resolve(response)
        );
      });

      await device.load({ routerRtpCapabilities: rtpCapabilities });
      stateRef.current.device = device;

      // Initialize transports
      await initializeTransports();

      // Handle new producers
      socketRef.current.on("newProducer", async ({ producerId, userId }) => {
        await consume(producerId, userId);
      });

      setIsConnected(true);
    } catch (err) {
      console.error("Failed to connect:", err);
      setError(err instanceof Error ? err.message : "Failed to connect");
    }
  }, [roomId, userId, initializeTransports, consume]);

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
