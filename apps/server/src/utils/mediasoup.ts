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

// Get the proper IP configuration
const getListenIps = (): types.TransportListenIp[] => {
  const listenIp = process.env.MEDIASOUP_LISTEN_IP || "0.0.0.0";
  const announcedIp = process.env.MEDIASOUP_ANNOUNCED_IP;

  // For local development
  if (!announcedIp) {
    return [
      {
        ip: "127.0.0.1",
      },
      {
        ip: "0.0.0.0",
        announcedIp: "127.0.0.1",
      },
    ];
  }

  // For production with explicit announced IP
  return [
    {
      ip: listenIp,
      announcedIp: announcedIp,
    },
  ];
};

// WebRTC transport settings
const webRtcTransportSettings: types.WebRtcTransportOptions = {
  listenIps: getListenIps(),
  initialAvailableOutgoingBitrate: 1000000, // 1 Mbps
  enableUdp: true,
  enableTcp: true,
  preferUdp: true,
  enableSctp: false, // We're not using DataChannels in this setup
};

// Supported media codecs - minimal configuration for debugging
const mediaCodecs: types.RtpCodecCapability[] = [
  {
    kind: "audio",
    mimeType: "audio/opus",
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: "video",
    mimeType: "video/VP8",
    clockRate: 90000,
  },
];

let worker: types.Worker | null = null;

export async function initMediasoupWorker(): Promise<types.Worker> {
  if (worker) return worker;

  try {
    worker = await createWorker(workerSettings);

    worker.on("died", () => {
      console.error("💥 mediasoup worker died — exiting process");
      process.exit(1);
    });

    console.log("✅ mediasoup worker started");
    console.log(`📊 Worker PID: ${worker.pid}`);
    console.log(
      `🔧 RTC ports: ${workerSettings.rtcMinPort}-${workerSettings.rtcMaxPort}`
    );

    return worker;
  } catch (error) {
    console.error("❌ Failed to create mediasoup worker:", error);
    throw error;
  }
}

export async function createMediasoupRouter(): Promise<types.Router> {
  const w = await initMediasoupWorker();

  try {
    const router = await w.createRouter({ mediaCodecs });

    console.log("🎛 mediasoup router created");
    console.log(
      `📋 Supported codecs: ${mediaCodecs.map((c) => c.mimeType).join(", ")}`
    );

    return router;
  } catch (error) {
    console.error("❌ Failed to create mediasoup router:", error);
    throw error;
  }
}

export async function createWebRtcTransport(
  router: types.Router
): Promise<types.WebRtcTransport> {
  try {
    const transport = await router.createWebRtcTransport(
      webRtcTransportSettings
    );

    transport.on("dtlsstatechange", (dtlsState: types.DtlsState) => {
      console.log(`🔐 DTLS state change: ${dtlsState}`);
      if (dtlsState === "closed") {
        transport.close();
      }
    });

    transport.on("@close", () => {
      console.log("🚪 WebRtcTransport closed");
    });

    transport.on("icestatechange", (iceState: types.IceState) => {
      console.log(`🧊 ICE state change: ${iceState}`);
    });

    console.log(`🚛 WebRTC transport created:`, {
      id: transport.id,
      iceRole: transport.iceRole,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates.length,
      dtlsParameters: transport.dtlsParameters.role,
    });

    return transport;
  } catch (error) {
    console.error("❌ Failed to create WebRTC transport:", error);
    throw error;
  }
}
