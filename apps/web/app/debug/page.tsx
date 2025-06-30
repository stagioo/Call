"use client";

import { useState } from "react";
import { Button } from "@call/ui/components/button";

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [device, setDevice] = useState<any>(null);

  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
    console.log(message);
  };

  const testConnection = async () => {
    try {
      addLog("Testing connection to mediasoup server...");

      const response = await fetch("http://localhost:1284/health");
      const data = await response.json();

      addLog(`Server response: ${JSON.stringify(data)}`);
      setIsConnected(true);
    } catch (error) {
      addLog(`Connection failed: ${error}`);
    }
  };

  const testMediasoupDevice = async () => {
    try {
      addLog("Testing mediasoup device loading...");

      // Import mediasoup-client
      const { Device } = await import("mediasoup-client");

      // Create socket connection
      const { io } = await import("socket.io-client");
      const socket = io("http://localhost:1284", {
        query: { roomId: "debug-room", userId: "debug-user" },
      });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("Connection timeout")),
          5000
        );

        socket.on("connect", () => {
          addLog("Socket connected successfully");
          socket.emit("join-room", {
            roomId: "debug-room",
            userId: "debug-user",
          });
        });

        socket.on("room-joined", async ({ rtpCapabilities }) => {
          try {
            clearTimeout(timeout);
            addLog("Room joined, received RTP capabilities");
            addLog(
              `Codecs available: ${rtpCapabilities.codecs?.map((c: any) => c.mimeType).join(", ")}`
            );

            const device = new Device();
            await device.load({ routerRtpCapabilities: rtpCapabilities });

            addLog(`Device loaded successfully`);
            addLog(`Can produce audio: ${device.canProduce("audio")}`);
            addLog(`Can produce video: ${device.canProduce("video")}`);

            setDevice(device);
            resolve();
          } catch (err) {
            addLog(`Device loading failed: ${err}`);
            reject(err);
          }
        });

        socket.on("connect_error", (error) => {
          clearTimeout(timeout);
          addLog(`Socket connection error: ${error}`);
          reject(error);
        });
      });
    } catch (error) {
      addLog(`Mediasoup test failed: ${error}`);
    }
  };

  const testMediaAccess = async () => {
    try {
      addLog("Testing media device access...");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      addLog(`Media stream obtained successfully`);
      addLog(`Audio tracks: ${stream.getAudioTracks().length}`);
      addLog(`Video tracks: ${stream.getVideoTracks().length}`);

      stream.getTracks().forEach((track) => {
        addLog(
          `Track: ${track.kind}, enabled: ${track.enabled}, readyState: ${track.readyState}`
        );
        track.stop();
      });
    } catch (error) {
      addLog(`Media access failed: ${error}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Mediasoup Debug Page</h1>

        <div className="grid gap-4 mb-8">
          <Button onClick={testConnection} variant="outline">
            Test Server Connection
          </Button>
          <Button onClick={testMediaAccess} variant="outline">
            Test Media Device Access
          </Button>
          <Button onClick={testMediasoupDevice} variant="outline">
            Test Mediasoup Device Loading
          </Button>
          <Button onClick={clearLogs} variant="destructive">
            Clear Logs
          </Button>
        </div>

        <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p>No logs yet. Click a test button to start debugging.</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>

        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          <p>Server Connected: {isConnected ? "✅ Yes" : "❌ No"}</p>
          <p>Device Loaded: {device ? "✅ Yes" : "❌ No"}</p>
          {device && (
            <div className="mt-2">
              <p>
                Can Produce Audio:{" "}
                {device.canProduce("audio") ? "✅ Yes" : "❌ No"}
              </p>
              <p>
                Can Produce Video:{" "}
                {device.canProduce("video") ? "✅ Yes" : "❌ No"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
