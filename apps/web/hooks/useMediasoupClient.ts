'use client';
import { useCallback, useRef, useState, useEffect } from "react";
import { Device } from "mediasoup-client";
import type {
  Transport,
  Consumer,
  TransportOptions,
  RtpCapabilities,
  RtpParameters,
} from "mediasoup-client/types";
import { useSocket } from "./useSocket";

interface JoinResponse {
  producers: {
    producerId: string;
    userId: string;
    kind: "audio" | "video";
  }[];
}

function useWsRequest(socket: WebSocket | null) {
  const pending = useRef(new Map<string, (data: any) => void>());

  const onMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      if (data.reqId && pending.current.has(data.reqId)) {
        pending.current.get(data.reqId)?.(data);
        pending.current.delete(data.reqId);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.addEventListener('message', onMessage);
    return () => {
      socket.removeEventListener('message', onMessage);
    };
  }, [socket, onMessage]);

  const sendRequest = useCallback((type: string, payload: any = {}) => {
    return new Promise<any>((resolve, reject) => {
      if (!socket || socket.readyState !== 1) {
        reject(new Error('WebSocket not connected'));
        return;
      }
      const reqId = Math.random().toString(36).slice(2);
      pending.current.set(reqId, resolve);
      socket.send(JSON.stringify({ ...payload, type, reqId }));
      setTimeout(() => {
        if (pending.current.has(reqId)) {
          pending.current.delete(reqId);
          reject(new Error('Timeout waiting for response'));
        }
      }, 8000);
    });
  }, [socket]);

  return sendRequest;
}

export function useMediasoupClient() {
  const { socket, connected } = useSocket();
  const sendRequest = useWsRequest(socket);
  const deviceRef = useRef<Device | null>(null);
  const sendTransportRef = useRef<Transport | null>(null);
  const recvTransportRef = useRef<Transport | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([]);

  const joinRoom = useCallback(
    async (roomId: string): Promise<JoinResponse> => {
      if (!socket || !connected) {
        throw new Error("WebSocket not connected");
      }
      await sendRequest("createRoom", { roomId });
      const response = await sendRequest("joinRoom", { roomId, token: "demo-token" });
      return response;
    },
    [socket, connected, sendRequest]
  );

  // Load mediasoup device
  const loadDevice = useCallback(async (rtpCapabilities: RtpCapabilities) => {
    let device = deviceRef.current;
    if (!device) {
      device = new Device();
      await device.load({ routerRtpCapabilities: rtpCapabilities });
      deviceRef.current = device;
    }
    return device;
  }, []);

  // Create send transport
  const createSendTransport = useCallback(async () => {
    if (!socket) return;
    const params = await sendRequest("createWebRtcTransport", {});
    const device = deviceRef.current;
    if (!device) throw new Error("Device not loaded");
    const transport = device.createSendTransport(params);
    transport.on("connect", ({ dtlsParameters }, callback, errback) => {
      sendRequest("connectWebRtcTransport", { transportId: transport.id, dtlsParameters })
        .then(() => callback())
        .catch(errback);
    });
    transport.on("produce", ({ kind, rtpParameters }, callback, errback) => {
      sendRequest("produce", { transportId: transport.id, kind, rtpParameters })
        .then((res) => callback({ id: res.id }))
        .catch(errback);
    });
    sendTransportRef.current = transport;
    return transport;
  }, [socket, sendRequest]);

  // Create recv transport
  const createRecvTransport = useCallback(async () => {
    if (!socket) return;
    const params = await sendRequest("createWebRtcTransport", {});
    const device = deviceRef.current;
    if (!device) throw new Error("Device not loaded");
    const transport = device.createRecvTransport(params);
    transport.on("connect", ({ dtlsParameters }, callback, errback) => {
      sendRequest("connectWebRtcTransport", { transportId: transport.id, dtlsParameters })
        .then(() => callback())
        .catch(errback);
    });
    recvTransportRef.current = transport;
    return transport;
  }, [socket, sendRequest]);

  // Produce local media
  const produce = useCallback(async (stream: MediaStream) => {
    if (!sendTransportRef.current) return;
    setLocalStream(stream);
    const producers = [];
    for (const track of stream.getTracks()) {
      try {
        const producer = await sendTransportRef.current.produce({ track });
        producers.push(producer);
      } catch (e) {
        // Ignorar errores individuales
      }
    }
    if (producers.length === 0) {
      stream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    return producers;
  }, []);

  // Consume remote media
  const consume = useCallback(
    async (
      producerId: string,
      rtpCapabilities: RtpCapabilities,
      onStream?: (stream: MediaStream, kind?: string) => void
    ) => {
      if (!recvTransportRef.current) return;
      const res = await sendRequest("consume", {
        transportId: recvTransportRef.current.id,
        producerId,
        rtpCapabilities,
      });
      const consumer: Consumer = await recvTransportRef.current.consume({
        id: res.id,
        producerId: res.producerId,
        kind: res.kind as "audio" | "video",
        rtpParameters: res.rtpParameters as RtpParameters,
      });
      const stream = new MediaStream([consumer.track]);
      if (onStream) onStream(stream, res.kind); // <-- PASA EL KIND AQUÍ
      else setRemoteStreams((prev) => [...prev, stream]);
    },
    [sendRequest]
  );

  return {
    joinRoom,
    loadDevice,
    createSendTransport,
    createRecvTransport,
    produce,
    consume,
    localStream,
    setLocalStream,
    remoteStreams,
    connected,
    socket,
    device: deviceRef.current,
    deviceRef,
  };
} 