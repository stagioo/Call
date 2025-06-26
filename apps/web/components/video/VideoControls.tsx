import { Button } from "@call/ui/components/button";
import { Mic, MicOff, Video, VideoOff, Phone, RefreshCw } from "lucide-react";

interface VideoControlsProps {
  isMuted: boolean;
  isVideoEnabled: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onLeaveCall: () => void;
  onReconnect?: () => void;
  isConnecting?: boolean;
}

export const VideoControls = ({
  isMuted,
  isVideoEnabled,
  onToggleMute,
  onToggleVideo,
  onLeaveCall,
  onReconnect,
  isConnecting = false,
}: VideoControlsProps) => {
  return (
    <div className="flex items-center justify-center gap-4 p-4 bg-black/20 backdrop-blur-sm rounded-lg">
      <Button
        variant="outline"
        size="icon"
        onClick={onToggleMute}
        className="w-12 h-12 rounded-full"
      >
        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={onToggleVideo}
        className="w-12 h-12 rounded-full"
      >
        {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
      </Button>

      {onReconnect && (
        <Button
          variant="outline"
          size="icon"
          onClick={onReconnect}
          disabled={isConnecting}
          className="w-12 h-12 rounded-full"
          title="Reconectar"
        >
          <RefreshCw className={`w-5 h-5 ${isConnecting ? 'animate-spin' : ''}`} />
        </Button>
      )}

      <Button
        variant="destructive"
        size="icon"
        onClick={onLeaveCall}
        className="w-12 h-12 rounded-full"
      >
        <Phone className="w-5 h-5" />
      </Button>
    </div>
  );
}; 