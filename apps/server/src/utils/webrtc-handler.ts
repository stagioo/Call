import type { types } from "mediasoup";
import type { Socket } from "socket.io";
import { createMediasoupRouter, createWebRtcTransport } from "./mediasoup";

interface RoomState {
  router: types.Router;
  peers: Map<string, Peer>;
}

interface Peer {
  socket: Socket;
  userId: string;
  transports: Map<string, types.WebRtcTransport>;
  producers: Map<string, types.Producer>;
  consumers: Map<string, types.Consumer>;
}

const rooms = new Map<string, RoomState>();

export async function handleWebRtcRequest(
  socket: Socket,
  roomId: string,
  userId: string
) {
  let room = rooms.get(roomId);

  // Create room if it doesn't exist
  if (!room) {
    const router = await createMediasoupRouter();
    room = {
      router,
      peers: new Map(),
    };
    rooms.set(roomId, room);
  }

  // Create peer if it doesn't exist
  const peer: Peer = {
    socket,
    userId,
    transports: new Map(),
    producers: new Map(),
    consumers: new Map(),
  };
  room.peers.set(socket.id, peer);

  // Handle transport creation
  socket.on(
    "createWebRtcTransport",
    async (data: { producing: boolean; consuming: boolean }, callback) => {
      try {
        console.log(`[WebRTC] Creating transport for peer ${userId}:`, data);
        const transport = await createWebRtcTransport(room!.router);

        // Set appData to identify the transport purpose
        transport.appData = {
          producing: data.producing,
          consuming: data.consuming,
          peerId: socket.id,
          userId: userId,
        };

        // Store transport
        peer.transports.set(transport.id, transport);

        console.log(`[WebRTC] Transport created successfully:`, {
          transportId: transport.id,
          producing: data.producing,
          consuming: data.consuming,
        });

        // Return transport parameters
        callback({
          ok: true,
          params: {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
          },
        });
      } catch (error) {
        console.error("Failed to create WebRTC transport:", error);
        callback({ ok: false });
      }
    }
  );

  // Handle transport connection
  socket.on(
    "connectWebRtcTransport",
    async (
      data: { transportId: string; dtlsParameters: types.DtlsParameters },
      callback
    ) => {
      const transport = peer.transports.get(data.transportId);
      if (!transport) {
        callback({ ok: false });
        return;
      }

      try {
        await transport.connect({ dtlsParameters: data.dtlsParameters });
        callback({ ok: true });
      } catch (error) {
        console.error("Failed to connect transport:", error);
        callback({ ok: false });
      }
    }
  );

  // Handle producer creation
  socket.on(
    "produce",
    async (
      data: {
        transportId: string;
        kind: types.MediaKind;
        rtpParameters: types.RtpParameters;
      },
      callback
    ) => {
      console.log(`[WebRTC] Produce request from ${userId}:`, {
        transportId: data.transportId,
        kind: data.kind,
      });

      const transport = peer.transports.get(data.transportId);
      if (!transport) {
        console.error(`[WebRTC] Transport not found: ${data.transportId}`);
        callback({ ok: false });
        return;
      }

      console.log(`[WebRTC] Found transport:`, {
        id: transport.id,
        closed: transport.closed,
        appData: transport.appData,
      });

      try {
        const producer = await transport.produce({
          kind: data.kind,
          rtpParameters: data.rtpParameters,
        });

        console.log(`[WebRTC] Producer created successfully:`, {
          producerId: producer.id,
          kind: producer.kind,
          paused: producer.paused,
        });

        // Store producer
        peer.producers.set(producer.id, producer);

        // Notify other peers in the room about the new producer
        socket.to(roomId).emit("newProducer", {
          producerId: producer.id,
          userId: peer.userId,
          kind: producer.kind,
        });

        callback({ ok: true, producerId: producer.id });
      } catch (error) {
        console.error(`[WebRTC] Failed to create producer:`, error);
        callback({ ok: false });
      }
    }
  );

  // Handle consumer creation
  socket.on(
    "consume",
    async (
      data: { producerId: string; rtpCapabilities: types.RtpCapabilities },
      callback
    ) => {
      try {
        const router = room!.router;

        // Check if the client can consume the producer
        if (
          !router.canConsume({
            producerId: data.producerId,
            rtpCapabilities: data.rtpCapabilities,
          })
        ) {
          console.log(`[WebRTC] Cannot consume producer ${data.producerId}`);
          callback({ ok: false });
          return;
        }

        // Get the consuming transport
        const transport = Array.from(peer.transports.values()).find(
          (t) => t.appData.consuming === true
        );
        if (!transport) {
          console.error(`[WebRTC] No consuming transport found`);
          callback({ ok: false });
          return;
        }

        // Create consumer
        const consumer = await transport.consume({
          producerId: data.producerId,
          rtpCapabilities: data.rtpCapabilities,
          paused: true, // Start paused, client will request resumption
        });

        console.log(`[WebRTC] Consumer created successfully:`, {
          consumerId: consumer.id,
          producerId: data.producerId,
          kind: consumer.kind,
        });

        // Store consumer
        peer.consumers.set(consumer.id, consumer);

        // Handle consumer events
        consumer.on("producerclose", () => {
          console.log(`[WebRTC] Producer closed for consumer ${consumer.id}`);
          consumer.close();
          peer.consumers.delete(consumer.id);
          socket.emit("consumerClosed", { consumerId: consumer.id });
        });

        callback({
          ok: true,
          params: {
            id: consumer.id,
            producerId: data.producerId,
            kind: consumer.kind,
            rtpParameters: consumer.rtpParameters,
            type: consumer.type,
            producerPaused: consumer.producerPaused,
          },
        });
      } catch (error) {
        console.error("Failed to create consumer:", error);
        callback({ ok: false });
      }
    }
  );

  // Handle consumer resumption
  socket.on(
    "resumeConsumer",
    async (data: { consumerId: string }, callback) => {
      const consumer = peer.consumers.get(data.consumerId);
      if (!consumer) {
        console.error(`[WebRTC] Consumer not found: ${data.consumerId}`);
        callback({ ok: false });
        return;
      }

      try {
        await consumer.resume();
        console.log(`[WebRTC] Consumer resumed: ${consumer.id}`);
        callback({ ok: true });
      } catch (error) {
        console.error("Failed to resume consumer:", error);
        callback({ ok: false });
      }
    }
  );

  // Handle get existing producers request
  socket.on("getProducers", (callback) => {
    const producers: Array<{
      producerId: string;
      userId: string;
      kind: types.MediaKind;
    }> = [];

    // Get all producers from other peers in the room
    for (const [peerId, otherPeer] of room!.peers.entries()) {
      if (peerId !== socket.id) {
        for (const [producerId, producer] of otherPeer.producers.entries()) {
          producers.push({
            producerId,
            userId: otherPeer.userId,
            kind: producer.kind,
          });
        }
      }
    }

    console.log(
      `[WebRTC] Sending ${producers.length} existing producers to ${userId}`
    );
    callback({ ok: true, producers });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`[WebRTC] Peer disconnecting: ${userId}`);

    // Close all transports, producers, and consumers
    for (const transport of peer.transports.values()) {
      transport.close();
    }

    // Remove peer from room
    room?.peers.delete(socket.id);

    // If room is empty, close router and remove room
    if (room?.peers.size === 0) {
      console.log(`[WebRTC] Closing empty room: ${roomId}`);
      room.router.close();
      rooms.delete(roomId);
    }
  });

  // Return router RTP capabilities
  return {
    rtpCapabilities: room.router.rtpCapabilities,
  };
}
