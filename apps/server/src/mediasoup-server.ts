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
    listenIps: [{ ip: '0.0.0.0', announcedIp: null }],
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

// Servidor HTTP y WebSocket para señalización
const httpServer = createServer();
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', async (message: string) => {
    let data;
    try {
      data = JSON.parse(message.toString());
    } catch (e) {
      ws.send(JSON.stringify({ error: 'Invalid JSON' }));
      return;
    }
    // Aquí irá la lógica de señalización de mediasoup (crear transport, connect, produce, consume, etc.)
    // Por ahora, solo responde con un mensaje de prueba
    ws.send(JSON.stringify({ type: 'pong', data: 'Mediasoup signaling server ready' }));
  });
});

const PORT = 4001;
httpServer.listen(PORT, () => {
  console.log(`[mediasoup] Signaling server running on ws://localhost:${PORT}`);
}); 