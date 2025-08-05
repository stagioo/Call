import { Button } from "@call/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@call/ui/components/dropdown-menu";
import { useEffect, useState } from "react";
import {
  FiChevronDown,
  FiMessageCircle,
  FiMic,
  FiMicOff,
  FiMonitor,
  FiPhoneOff,
  FiUsers,
  FiVideo,
  FiVideoOff,
} from "react-icons/fi";

interface MediaControlsProps {
  localStream: MediaStream | null;
  joined: boolean;
  onHangup: () => void;
  isScreenSharing: boolean;
  onToggleScreenShare: () => void;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  isMicOn: boolean;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onDeviceChange: (type: "video" | "audio", deviceId: string) => void;
  videoDevices: MediaDeviceInfo[];
  audioDevices: MediaDeviceInfo[];
  selectedVideo: string;
  selectedAudio: string;
}

export const MediaControls = ({
  localStream,
  joined,
  onHangup,
  isScreenSharing,
  onToggleScreenShare,
  onToggleCamera,
  onToggleMic,
  isMicOn,
  onToggleChat,
  onToggleParticipants,
  onDeviceChange,
  videoDevices,
  audioDevices,
  selectedVideo,
  selectedAudio,
}: MediaControlsProps) => {
  const [isCameraOn, setIsCameraOn] = useState(true);

  useEffect(() => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();

      if (videoTracks.length > 0 && videoTracks[0]) {
        setIsCameraOn(videoTracks[0].enabled);
      }
    }
  }, [localStream]);

  const handleToggleCamera = () => {
    onToggleCamera();
    setIsCameraOn((prev) => !prev);
  };

  const handleDeviceChange = (type: "video" | "audio", deviceId: string) => {
    onDeviceChange(type, deviceId);
  };

  return (
    <>
      <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 gap-2 rounded-lg bg-black/80 p-3 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          className={`relative h-12 w-12 rounded-full ${
            isMicOn
              ? "bg-gray-700 text-white hover:bg-gray-600"
              : "bg-red-600 text-white hover:bg-red-700"
          }`}
          onClick={onToggleMic}
        >
          {isMicOn ? <FiMic size={20} /> : <FiMicOff size={20} />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-gray-700 text-white hover:bg-gray-600"
            >
              <FiChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="mb-2 w-56">
            <div className="px-2 py-1 text-xs font-semibold text-gray-600">
              Microphone
            </div>
            {audioDevices.map((device) => (
              <DropdownMenuItem
                key={device.deviceId}
                onClick={() => handleDeviceChange("audio", device.deviceId)}
                className={`cursor-pointer ${
                  selectedAudio === device.deviceId ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="truncate">
                    {device.label ||
                      `Microphone (${device.deviceId.slice(0, 8)}...)`}
                  </span>
                  {selectedAudio === device.deviceId && (
                    <div className="ml-2 h-2 w-2 rounded-full bg-blue-600"></div>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className={`relative h-12 w-12 rounded-full ${
            isCameraOn
              ? "bg-gray-700 text-white hover:bg-gray-600"
              : "bg-red-600 text-white hover:bg-red-700"
          }`}
          onClick={handleToggleCamera}
        >
          {isCameraOn ? <FiVideo size={20} /> : <FiVideoOff size={20} />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-gray-700 text-white hover:bg-gray-600"
            >
              <FiChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="mb-2 w-56">
            <div className="px-2 py-1 text-xs font-semibold text-gray-600">
              Camera
            </div>
            {videoDevices.map((device) => (
              <DropdownMenuItem
                key={device.deviceId}
                onClick={() => handleDeviceChange("video", device.deviceId)}
                className={`cursor-pointer ${
                  selectedVideo === device.deviceId ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="truncate">
                    {device.label ||
                      `Camera (${device.deviceId.slice(0, 8)}...)`}
                  </span>
                  {selectedVideo === device.deviceId && (
                    <div className="ml-2 h-2 w-2 rounded-full bg-blue-600"></div>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className={`h-12 w-12 rounded-full ${
            isScreenSharing
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-700 text-white hover:bg-gray-600"
          }`}
          onClick={onToggleScreenShare}
        >
          <FiMonitor size={20} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative h-12 w-12 rounded-full bg-gray-700 text-white hover:bg-gray-600"
          onClick={onToggleParticipants}
        >
          <FiUsers size={20} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative h-12 w-12 rounded-full bg-gray-700 text-white hover:bg-gray-600"
          onClick={onToggleChat}
        >
          <FiMessageCircle size={20} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative h-12 w-12 rounded-full bg-red-600 text-white hover:bg-red-700"
          onClick={onHangup}
        >
          <FiPhoneOff size={20} />
        </Button>
      </div>
    </>
  );
};

export default MediaControls;
