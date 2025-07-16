import Worker from 'mediasoup/lib/Worker';
import type * as types from 'mediasoup/lib/types';


const RTC_MIN_PORT = 10000;
const RTC_MAX_PORT = 20000;
const numWorkers = 1;


const mediaCodecs: types.RtpCodecCapability[] = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
    parameters: {},
  },
];


let worker: types.Worker | null = null;

const routers: Map<string, types.Router> = new Map();

export async function initMediasoup() {
  if (worker) return; 
  worker = await Worker.create({
    rtcMinPort: RTC_MIN_PORT,
    rtcMaxPort: RTC_MAX_PORT,
    logLevel: 'warn',
    logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'],
  });
}

export async function createRouterForCall(callId: string): Promise<types.Router> {
  if (!worker) throw new Error('Mediasoup worker not initialized');
  if (routers.has(callId)) return routers.get(callId)!;
  const router = await worker.createRouter({ mediaCodecs });
  routers.set(callId, router);
  return router;
}

export function getRouter(callId: string): types.Router | undefined {
  return routers.get(callId);
}

export function getMediasoupWorker(): types.Worker | null {
  return worker;
} 