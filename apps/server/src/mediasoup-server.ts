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

const transports = new Map<string, mediasoup.types.WebRtcTransport>();

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', async (message: string) => {
    let data;
    try {
      data = JSON.parse(message.toString());
    } catch (e) {
      ws.send(JSON.stringify({ error: 'Invalid JSON' }));
      return;
    }
    
    if (data.type === 'createRoom') {
      ws.send(JSON.stringify({ reqId: data.reqId, type: 'createRoomResponse', success: true }));
      return;
    }
    if (data.type === 'joinRoom') {
      ws.send(JSON.stringify({
        reqId: data.reqId,
        type: 'joinRoomResponse',
        rtpCapabilities: router.rtpCapabilities,
        producers: [],
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
 
    ws.send(JSON.stringify({ reqId: data.reqId, type: 'pong', data: 'Mediasoup signaling server ready' }));
  });
});

const PORT = 4001;
httpServer.listen(PORT, () => {
  console.log(`[mediasoup] Signaling server running on ws://localhost:${PORT}`);
}); 