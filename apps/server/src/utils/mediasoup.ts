import type { types } from "mediasoup";
import { createWorker } from "mediasoup";

// Mediasoup worker settings
const workerSettings = {
  logLevel: "warn" as const,
  logTags: [
    "info",
    "ice",
    "dtls",
    "rtp",
    "srtp",
    "rtcp",
  ] as types.WorkerLogTag[],
  rtcMinPort: 40000,
  rtcMaxPort: 49999,
};

// WebRTC transport settings
const webRtcTransportSettings: types.WebRtcTransportOptions = {
  listenIps: [
    {
      ip: process.env.MEDIASOUP_LISTEN_IP || "0.0.0.0",
      announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || "127.0.0.1", // Replace with your public IP
    },
  ],
  initialAvailableOutgoingBitrate: 1000000, // 1 Mbps
  enableUdp: true,
  enableTcp: true,
  preferUdp: true,
};

// Supported media codecs
const mediaCodecs: types.RtpCodecCapability[] = [
  {
    kind: "audio",
    mimeType: "audio/opus",
    clockRate: 48000,
    channels: 2,
    parameters: {
      maxPlaybackRate: 48000,
      stereo: 1,
      useinbandfec: 1,
    },
  },
  {
    kind: "video",
    mimeType: "video/VP8",
    clockRate: 90000,
    parameters: {
      "x-google-start-bitrate": 1000, // 1 Mbps
    },
  },
  {
    kind: "video",
    mimeType: "video/H264",
    clockRate: 90000,
    parameters: {
      "packetization-mode": 1,
      "profile-level-id": "42e01f",
      "level-asymmetry-allowed": 1,
      "x-google-start-bitrate": 1000, // 1 Mbps
    },
  },
];

let worker: types.Worker | null = null;

export async function initMediasoupWorker(): Promise<types.Worker> {
  if (worker) return worker;

  worker = await createWorker(workerSettings);

  worker.on("died", () => {
    console.error("💥 mediasoup worker died — exiting process");
    process.exit(1);
  });

  console.log("✅ mediasoup worker started");

  return worker;
}

export async function createMediasoupRouter(): Promise<types.Router> {
  const w = await initMediasoupWorker();
  const router = await w.createRouter({ mediaCodecs });

  console.log("🎛 mediasoup router created");
  return router;
}

export async function createWebRtcTransport(
  router: types.Router
): Promise<types.WebRtcTransport> {
  const transport = await router.createWebRtcTransport(webRtcTransportSettings);

  transport.on("dtlsstatechange", (dtlsState: types.DtlsState) => {
    if (dtlsState === "closed") {
      transport.close();
    }
  });

  transport.on("@close", () => {
    console.log("WebRtcTransport closed");
  });

  return transport;
}
