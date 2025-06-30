"use client";

import { useEffect, useState, use } from "react";
import { Button } from "@call/ui/components/button";
import { apiClient } from "@/lib/api-client";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { VideoControls } from "@/components/video/VideoControls";
import { useRouter } from "next/navigation";
import { useMediasoup } from "@/hooks/useMediasoup";

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
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const router = useRouter();

  const userId = useState(
    () => `user_${Math.random().toString(36).substr(2, 9)}`
  )[0];

  const {
    connect,
    disconnect,
    produce,
    isConnected,
    error: mediasoupError,
    participants,
  } = useMediasoup(roomId, userId);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

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
        console.error("Error fetching room:", err);
        setError("Room not found");
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId]);

  const handleJoinCall = async () => {
    try {
      console.log(
        `[handleJoinCall] Starting join process. Current hasJoined:`,
        hasJoined
      );

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      console.log(`[handleJoinCall] Got media stream:`, {
        active: stream.active,
        tracks: stream.getTracks().map((track) => ({
          kind: track.kind,
          enabled: track.enabled,
          readyState: track.readyState,
        })),
      });

      setLocalStream(stream);
      console.log(`[handleJoinCall] Set local stream state`);

      console.log(`[handleJoinCall] Connecting to mediasoup server`);
      await connect();
      console.log(`[handleJoinCall] Connected to mediasoup server`);

      // Wait a moment for transports to be fully ready
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      console.log(`[handleJoinCall] Producing tracks:`, {
        video: videoTrack
          ? {
              enabled: videoTrack.enabled,
              readyState: videoTrack.readyState,
            }
          : null,
        audio: audioTrack
          ? {
              enabled: audioTrack.enabled,
              readyState: audioTrack.readyState,
            }
          : null,
      });

      // Produce video first (it's usually more forgiving)
      if (videoTrack) {
        console.log(`[handleJoinCall] Producing video track...`);
        try {
          await produce(videoTrack);
          console.log(`[handleJoinCall] Video track produced successfully`);
        } catch (error) {
          console.error(
            `[handleJoinCall] Failed to produce video track:`,
            error
          );
          // Continue anyway, maybe audio will work
        }
      }

      // Then produce audio
      if (audioTrack) {
        console.log(`[handleJoinCall] Producing audio track...`);
        try {
          await produce(audioTrack);
          console.log(`[handleJoinCall] Audio track produced successfully`);
        } catch (error) {
          console.error(
            `[handleJoinCall] Failed to produce audio track:`,
            error
          );
          // Continue anyway, maybe video worked
        }
      }

      console.log(`[handleJoinCall] Setting hasJoined to true`);
      setHasJoined(true);
      console.log(`[handleJoinCall] Join process completed`);
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
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    disconnect();
    setHasJoined(false);
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
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
      } catch (error) {
        console.error("Error sharing link:", error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(roomUrl);
        alert("Link copied to clipboard!");
      } catch (err) {
        console.error("Error copying link to clipboard:", err);
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
                  Click &quot;Join&quot; to start the video call.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleJoinCall} disabled={hasJoined}>
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

      <div className="flex-1 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="aspect-video">
              <VideoPlayer
                stream={localStream}
                isLocal={true}
                className="w-full h-full"
              />
            </div>

            {participants.map((participant) => (
              <div key={participant.userId} className="aspect-video relative">
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

          <div className="mb-4 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <p>Total participants: {participants.length + 1}</p>
            <p>Connected: {isConnected ? "Yes" : "No"}</p>
            <p>Local stream: {localStream ? "Yes" : "No"}</p>
            <p>Local stream active: {localStream?.active ? "Yes" : "No"}</p>
            <p>Local tracks: {localStream?.getTracks().length || 0}</p>
            <p>
              Remote participants with streams:{" "}
              {participants.filter((p) => p.stream).length}
            </p>
            <div className="mt-2">
              <h4 className="font-medium">Remote streams:</h4>
              {participants.map((participant) => (
                <div key={participant.userId} className="ml-2 text-sm">
                  {participant.userId}:{" "}
                  {participant.stream
                    ? `${participant.stream.getTracks().length} tracks, ${participant.stream.active ? "active" : "inactive"}`
                    : "No stream"}
                  {participant.tracks && participant.tracks.size > 0 && (
                    <div className="ml-4 text-xs text-muted-foreground">
                      Tracks: {Array.from(participant.tracks.keys()).join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {mediasoupError && (
              <p className="text-red-500 mt-2">Error: {mediasoupError}</p>
            )}
          </div>

          <div className="flex justify-center">
            <VideoControls
              isMuted={isMuted}
              isVideoEnabled={isVideoEnabled}
              onToggleMute={toggleMute}
              onToggleVideo={toggleVideo}
              onLeaveCall={handleLeaveCall}
              onReconnect={connect}
              isConnecting={!isConnected}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCallPage;
