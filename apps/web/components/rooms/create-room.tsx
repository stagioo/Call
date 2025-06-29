"use client"
import { useState, useEffect, useRef } from "react";
import { Button } from "@call/ui/components/button";
// You can replace these with shadcn/ui dropdown components if available
import { Input } from "@call/ui/components/input";

const CreateRoom = () => {
  // State to control the step (initial or config)
  const [showConfig, setShowConfig] = useState(false);
  // State for media devices
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [selectedMic, setSelectedMic] = useState<string>("");
  const [roomName, setRoomName] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  // Get available media devices
  useEffect(() => {
    if (!showConfig) return;
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      setCameras(devices.filter((d) => d.kind === "videoinput"));
      setMicrophones(devices.filter((d) => d.kind === "audioinput"));
    });
  }, [showConfig]);

  // Start camera preview when config is shown or camera changes
  useEffect(() => {
    if (!showConfig || !selectedCamera) return;
    const startPreview = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: selectedCamera },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    };
    startPreview();
    // Cleanup: stop tracks on unmount/change
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream | undefined;
      stream?.getTracks?.().forEach((track) => track.stop());
    };
  }, [showConfig, selectedCamera]);

  // Set default camera/mic when devices are loaded
  useEffect(() => {
    if (cameras.length && !selectedCamera) setSelectedCamera(cameras[0]?.deviceId ?? "");
    if (microphones.length && !selectedMic) setSelectedMic(microphones[0]?.deviceId ?? "");
  }, [cameras, microphones]);

  // UI for the configuration step
  const renderConfig = () => (
    <div className="flex flex-col items-center bg-[#181818] p-8 rounded-lg shadow-lg">
      {/* Camera Preview */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-96 h-64 rounded-md bg-black mb-4 object-cover"
      />
      {/* Device selectors */}
      <div className="flex gap-4 mb-4 w-full">
        {/* Microphone Dropdown */}
        <div className="flex-1">
          <label className="block text-white mb-1 text-sm">Microphone</label>
          <select
            className="w-full rounded-md p-2 bg-[#232323] text-white"
            value={selectedMic}
            onChange={(e) => setSelectedMic(e.target.value)}
          >
            {microphones.map((mic) => (
              <option key={mic.deviceId} value={mic.deviceId}>
                {mic.label || `Microphone ${mic.deviceId}`}
              </option>
            ))}
          </select>
        </div>
        {/* Camera Dropdown */}
        <div className="flex-1">
          <label className="block text-white mb-1 text-sm">Camera</label>
          <select
            className="w-full rounded-md p-2 bg-[#232323] text-white"
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
          >
            {cameras.map((cam) => (
              <option key={cam.deviceId} value={cam.deviceId}>
                {cam.label || `Camera ${cam.deviceId}`}
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* Room name input */}
      <Input
        className="mb-4 w-full"
        placeholder="Room name"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
      />
      {/* Join Room button (does nothing for now) */}
      <Button className="w-full rounded-md">Join Room</Button>
    </div>
  );

  return (
    <div className="w-screen min-h-screen bg-[#101010] flex items-center justify-center">
      {!showConfig ? (
        <Button className="rounded-md" onClick={() => setShowConfig(true)}>
          Start Meet
        </Button>
      ) : (
        renderConfig()
      )}
    </div>
  );
};

export default CreateRoom;
