import * as mediasoup from 'mediasoup';
import os from 'os';

const RTC_MIN_PORT = 10000;
const RTC_MAX_PORT = 20000;

const mediaCodecs = [
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
    parameters: {
      'x-google-start-bitrate': 1000,
    },
  },
];

// Pool de workers similar a exp1
const workers: any[] = [];
let nextWorkerIndex = 0;

export async function initMediasoup() {
  if (workers.length > 0) return; // Ya inicializado
  
  const numWorkers = os.cpus().length;
  console.log(`Creating ${numWorkers} mediasoup workers...`);

  for (let i = 0; i < numWorkers; i++) {
    try {
      const worker = await mediasoup.createWorker({
        logLevel: 'debug',
        logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'],
        rtcMinPort: RTC_MIN_PORT,
        rtcMaxPort: RTC_MAX_PORT,
      });

      worker.on('died', () => {
        console.error(`mediasoup worker died [pid:${worker.pid}]`);
        // Remove the worker from the pool
        const index = workers.indexOf(worker);
        if (index > -1) {
          workers.splice(index, 1);
        }
        // If no workers left, exit the process
        if (workers.length === 0) {
          console.error('No mediasoup workers left, exiting...');
          setTimeout(() => {
            process.exit(1);
          }, 2000);
        }
      });

      workers.push(worker);
      console.log(`Created mediasoup worker #${i} [pid:${worker.pid}]`);
    } catch (error) {
      console.error(`Failed to create mediasoup worker #${i}:`, error);
      throw error;
    }
  }
}

export function getMediasoupWorker(): any {
  if (workers.length === 0) {
    throw new Error('No mediasoup workers available');
  }
  const worker = workers[nextWorkerIndex];
  nextWorkerIndex = (nextWorkerIndex + 1) % workers.length;
  return worker;
}

const routers: Map<string, any> = new Map();

export async function createRouterForCall(callId: string) {
  if (routers.has(callId)) return routers.get(callId)!;
  
  const worker = getMediasoupWorker();
  const router = await worker.createRouter({ mediaCodecs });
  routers.set(callId, router);
  console.log(`Created router for call ${callId}`);
  return router;
}

export function getRouter(callId: string) {
  return routers.get(callId);
}

export function removeRouter(callId: string) {
  const router = routers.get(callId);
  if (router) {
    router.close();
    routers.delete(callId);
    console.log(`Removed router for call ${callId}`);
  }
} 