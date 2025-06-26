"use client";

import { useEffect, useState, use } from "react";
import { Button } from "@call/ui/components/button";
import { apiClient } from "@/lib/api-client";
import { useWebRTC } from "@/hooks/useWebRTC";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { VideoControls } from "@/components/video/VideoControls";
import { useRouter } from "next/navigation";

interface Room {
  id: string;
  name: string;
  joinCode: string;
  createdAt: string;
}

interface VideoCallPageProps {
  params: Promise<{ roomId: string }>;
}

const VideoCallPage = ({ params }: VideoCallPageProps) => {
  const { roomId } = use(params);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const router = useRouter();

  const {
    localStream,
    participants,
    isConnected,
    isHost,
    joinRoom,
    leaveRoom,
    toggleMute,
    toggleVideo,
    isMuted,
    isVideoEnabled,
    reconnect,
    isConnecting,
  } = useWebRTC();

  // Debug logs
  useEffect(() => {
    console.log("Participants updated:", participants);
    console.log("Local stream:", localStream);
    console.log("Is connected:", isConnected);
  }, [participants, localStream, isConnected]);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await apiClient.get(`/api/room/${roomId}`);
        if (response.data.success) {
          setRoom(response.data.room);
        } else {
          setError("Could not load the room");
        }
      } catch (err) {
        setError("Room not found");
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId]);

  const handleJoinCall = async () => {
    try {
      const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
      await joinRoom(roomId, userId);
      setHasJoined(true);
    } catch (error) {
      console.error("Error joining call:", error);
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          alert(
            "Error: You need to allow access to the camera and microphone to join the call."
          );
        } else if (error.name === "NotFoundError") {
          alert(
            "Error: Camera or microphone not found. Please check that your device has these devices."
          );
        } else {
          alert(`Error joining the call: ${error.message}`);
        }
      } else {
        alert(
          "Error joining the call. Please verify that you have camera and microphone permissions."
        );
      }
    }
  };

  const handleLeaveCall = () => {
    leaveRoom();
    setHasJoined(false);
  };

  const shareRoom = async () => {
    const roomUrl = `${window.location.origin}/r/${roomId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${room?.name}`,
          text: `Join my video call room: ${room?.name}`,
          url: roomUrl,
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(roomUrl);
        alert("Link copied to clipboard!");
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = roomUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        alert("Link copied to clipboard!");
      }
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading room...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Room not found</h1>
          <p className="text-muted-foreground mb-4">
            The room you are looking for does not exist or has been deleted.
          </p>
          <Button onClick={() => router.push("/r")}>Create new room</Button>
        </div>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">{room.name}</h1>
              <p className="text-sm text-muted-foreground">
                Code: {room.joinCode}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={shareRoom}>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                  />
                </svg>
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Join Call Screen */}
        <div className="flex-1 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-muted rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold mb-2">Video Call</h2>
                <p className="text-muted-foreground mb-4">
                  Click "Join" to start the video call
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={handleJoinCall}
                    disabled={!isConnected && hasJoined}
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Join
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{room.name}</h1>
            <p className="text-sm text-muted-foreground">
              Code: {room.joinCode} • {participants.length + 1} participants
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={shareRoom}>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                />
              </svg>
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Video Call Area */}
      <div className="flex-1 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Local Video */}
            <div className="aspect-video">
              <VideoPlayer
                stream={localStream}
                isLocal={true}
                className="w-full h-full"
              />
            </div>

            {/* Remote Videos */}
            {participants.map((participant) => (
              <div key={participant.socketId} className="aspect-video">
                <VideoPlayer
                  stream={participant.stream || null}
                  isLocal={false}
                  className="w-full h-full"
                />
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {participant.userId}
                </div>
              </div>
            ))}
          </div>

          {/* Debug Info */}
          <div className="mb-4 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <p>Participants: {participants.length + 1}</p>
            <p>Connected: {isConnected ? "Yes" : "No"}</p>
            <p>Is host: {isHost ? "Yes" : "No"}</p>
            <p>Local stream: {localStream ? "Yes" : "No"}</p>
            <p>Remote streams: {participants.filter((p) => p.stream).length}</p>
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log("=== DEBUG INFO ===");
                  console.log("Local stream:", localStream);
                  console.log("Participants:", participants);
                }}
              >
                Debug Console
              </Button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center">
            <VideoControls
              isMuted={isMuted}
              isVideoEnabled={isVideoEnabled}
              onToggleMute={toggleMute}
              onToggleVideo={toggleVideo}
              onLeaveCall={handleLeaveCall}
              onReconnect={reconnect}
              isConnecting={isConnecting}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCallPage;
