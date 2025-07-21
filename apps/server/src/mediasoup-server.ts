import * as mediasoup from 'mediasoup';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

// Configuración básica de mediasoup
const mediasoupConfig = {
  worker: {
    rtcMinPort: 40000,
    rtcMaxPort: 49999,
    logLevel: 'warn' as mediasoup.types.WorkerLogLevel,
    logTags: [
      'info' as mediasoup.types.WorkerLogTag,
      'ice' as mediasoup.types.WorkerLogTag,
      'dtls' as mediasoup.types.WorkerLogTag,
      'rtp' as mediasoup.types.WorkerLogTag,
      'srtp' as mediasoup.types.WorkerLogTag,
      'rtcp' as mediasoup.types.WorkerLogTag,
    ],
  },
  router: {
    mediaCodecs: [
      {
        kind: 'audio' as mediasoup.types.MediaKind,
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
      },
      {
        kind: 'video' as mediasoup.types.MediaKind,
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {},
      },
    ],
  },
  webRtcTransport: {
    listenIps: [{ ip: '0.0.0.0', announcedIp: undefined }],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    initialAvailableOutgoingBitrate: 800000,
  },
};

let worker: mediasoup.types.Worker;
let router: mediasoup.types.Router;

async function startMediasoup() {
  worker = await mediasoup.createWorker(mediasoupConfig.worker);
  router = await worker.createRouter({ mediaCodecs: mediasoupConfig.router.mediaCodecs });
  console.log('[mediasoup] Worker y router inicializados');
}

startMediasoup().catch(console.error);

const httpServer = createServer();
const wss = new WebSocketServer({ server: httpServer });

// Mapa para guardar los transports y producers por conexión
const transports = new Map<string, mediasoup.types.WebRtcTransport>();
const producers = new Map<string, mediasoup.types.Producer>();
const clients = new Set<WebSocket>();

wss.on('connection', (ws: WebSocket) => {
  console.log('[mediasoup] Nueva conexión WebSocket');
  clients.add(ws);
  ws.on('close', () => {
    clients.delete(ws);
  });
  ws.on('message', async (message: string) => {
    let data;
    try {
      data = JSON.parse(message.toString());
    } catch (e) {
      ws.send(JSON.stringify({ error: 'Invalid JSON' }));
      return;
    }
    // Lógica de señalización de mediasoup
    if (data.type === 'createRoom') {
      ws.send(JSON.stringify({ reqId: data.reqId, type: 'createRoomResponse', success: true }));
      return;
    }
    if (data.type === 'joinRoom') {
      ws.send(JSON.stringify({
        reqId: data.reqId,
        type: 'joinRoomResponse',
        rtpCapabilities: router.rtpCapabilities,
        producers: Array.from(producers.values()).map(p => ({ id: p.id, kind: p.kind })),
      }));
      return;
    }
    if (data.type === 'createWebRtcTransport') {
      try {
        const transport = await router.createWebRtcTransport({
          listenIps: mediasoupConfig.webRtcTransport.listenIps,
          enableUdp: mediasoupConfig.webRtcTransport.enableUdp,
          enableTcp: mediasoupConfig.webRtcTransport.enableTcp,
          preferUdp: mediasoupConfig.webRtcTransport.preferUdp,
          initialAvailableOutgoingBitrate: mediasoupConfig.webRtcTransport.initialAvailableOutgoingBitrate,
        });
        transports.set(transport.id, transport);
        ws.send(JSON.stringify({
          reqId: data.reqId,
          type: 'createWebRtcTransportResponse',
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
          sctpParameters: transport.sctpParameters,
        }));
      } catch (err: any) {
        ws.send(JSON.stringify({
          reqId: data.reqId,
          type: 'createWebRtcTransportResponse',
          error: err.message,
        }));
      }
      return;
    }
    if (data.type === 'connectWebRtcTransport') {
      const transport = transports.get(data.transportId);
      if (!transport) {
        ws.send(JSON.stringify({ reqId: data.reqId, error: 'Transport not found' }));
        return;
      }
      await transport.connect({ dtlsParameters: data.dtlsParameters });
      ws.send(JSON.stringify({ reqId: data.reqId, type: 'connectWebRtcTransportResponse', connected: true }));
      return;
    }
    if (data.type === 'produce') {
      const transport = transports.get(data.transportId);
      if (!transport) {
        console.log('[produce] Transport not found:', data.transportId);
        ws.send(JSON.stringify({ reqId: data.reqId, error: 'Transport not found' }));
        return;
      }
      try {
        const producer = await transport.produce({
          kind: data.kind,
          rtpParameters: data.rtpParameters,
        });
        producers.set(producer.id, producer);
        console.log('[produce] Producer created:', producer.id, 'kind:', producer.kind);
        ws.send(JSON.stringify({ reqId: data.reqId, type: 'produceResponse', id: producer.id }));
        // Notificar a todos los demás clientes del nuevo producer
        for (const client of clients) {
          if (client !== ws && client.readyState === 1) {
            client.send(JSON.stringify({ type: 'newProducer', id: producer.id, kind: producer.kind }));
          }
        }
      } catch (err: any) {
        console.log('[produce] Error:', err.message);
        ws.send(JSON.stringify({ reqId: data.reqId, error: err.message }));
      }
      return;
    }
    if (data.type === 'consume') {
      const transport = transports.get(data.transportId);
      const producer = producers.get(data.producerId);
      if (!transport || !producer) {
        console.log('[consume] Transport or producer not found:', data.transportId, data.producerId);
        ws.send(JSON.stringify({ reqId: data.reqId, error: 'Transport or producer not found' }));
        return;
      }
      try {
        const consumer = await transport.consume({
          producerId: producer.id,
          rtpCapabilities: data.rtpCapabilities,
          paused: false,
        });
        console.log('[consume] Consumer created:', consumer.id, 'for producer:', producer.id);
        ws.send(JSON.stringify({
          reqId: data.reqId,
          type: 'consumeResponse',
          id: consumer.id,
          producerId: producer.id,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
        }));
      } catch (err: any) {
        console.log('[consume] Error:', err.message);
        ws.send(JSON.stringify({ reqId: data.reqId, error: err.message }));
      }
      return;
    }
    // Respuesta por defecto
    ws.send(JSON.stringify({ reqId: data.reqId, type: 'pong', data: 'Mediasoup signaling server ready' }));
  });
});

const PORT = 4001;
httpServer.listen(PORT, () => {
  console.log(`[mediasoup] Signaling server running on ws://localhost:${PORT}`);
}); 