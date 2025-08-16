"use client";

import { CallPreview } from "@/components/call/call-preview";
import { CallVideoGrid } from "@/components/call/call-video-grid";
import { MediaControls } from "@/components/call/media-controls";
import { ChatSidebar } from "@/components/rooms/chat-sidebar";
import { useCallContext } from "@/contexts/call-context";
import { useCallJoin } from "@/hooks/use-call-join";
import { useCallDevices } from "@/hooks/use-call-devices";
import { useCallMediaControls } from "@/hooks/use-call-media-controls";
import { useCallProducers } from "@/hooks/use-call-producers";
import { useNotificationSound } from "@/hooks/use-notification-sound";
import type { ActiveSection } from "@/lib/types";
import { Button } from "@call/ui/components/button";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function CallPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<ActiveSection | null>(
    null
  );
  const { state, dispatch, mediasoup, session } = useCallContext();
  const {
    toggleCamera,
    toggleMic,
    handleToggleScreenShare,
    handleHangup,
    isScreenSharing,
    isMicOn,
  } = useCallMediaControls();

  const { videoDevices, audioDevices, handleDeviceChange } = useCallDevices();
  const { playNotificationSound } = useNotificationSound("request-joined");
  const { handleJoin } = useCallJoin();

  useCallProducers();

  useEffect(() => {
    if (!mediasoup.socket) return;

    const handleJoinRequest = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.type === "requestJoinResponse") {
          if (state.isCreator) {
            toast.custom(
              (t) => (
                <RequestJoinToast
                  socket={mediasoup.socket as WebSocket}
                  name={data.displayName || "Someone"}
                  reqId={data.reqId}
                  roomId={state.callId as string}
                  peerId={data.peerId}
                  requesterId={data.requesterId}
                  toastId={t}
                />
              ),
              {
                duration: 10000,
              }
            );
            playNotificationSound();
          }
        }
      } catch (e) {}
    };

    mediasoup.socket.addEventListener("message", handleJoinRequest);
    return () => {
      mediasoup.socket?.removeEventListener("message", handleJoinRequest);
    };
  }, [mediasoup.socket, state.isCreator, state.callId, playNotificationSound]);

  useEffect(() => {
    if (!mediasoup.socket) return;

    const handleApproval = async (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.type === "joinApproved" && data.roomId === state.callId) {
          if (state.joined || !state.callId) return;

          handleJoin();
        }
      } catch {}
    };

    mediasoup.socket.addEventListener("message", handleApproval);
    return () => {
      mediasoup.socket?.removeEventListener("message", handleApproval);
    };
  }, [
    mediasoup,
    state.callId,
    state.joined,
    state.previewStream,
    state.selectedVideo,
    state.selectedAudio,
    state.isLocalMicOn,
    state.isLocalCameraOn,
    dispatch,
  ]);

  useEffect(() => {
    const callId = params?.id as string;
    if (callId) {
      dispatch({ type: "SET_CALL_ID", payload: callId });
    }
  }, [params?.id, dispatch]);

  useEffect(() => {
    const audioStreams = mediasoup.remoteStreams.filter(
      (stream) =>
        stream.kind === "audio" &&
        (stream.source === "mic" || stream.source === "webcam")
    );

    dispatch({
      type: "SET_REMOTE_AUDIOS",
      payload: audioStreams.map((stream) => ({
        id: stream.producerId,
        stream: stream.stream,
        peerId: stream.peerId,
        displayName: stream.displayName,
      })),
    });
  }, [mediasoup.remoteStreams, dispatch]);

  const participants = [
    ...(state.creatorInfo
      ? [
          {
            id: state.creatorInfo.creatorId,
            displayName:
              state.creatorInfo.creatorName || state.creatorInfo.creatorEmail,
            isCreator: true,
            isMicOn:
              state.creatorInfo.creatorId === mediasoup.userId
                ? isMicOn
                : !mediasoup.remoteStreams.find(
                    (s) => s.peerId === state.creatorInfo?.creatorId
                  )?.muted,
            isCameraOn: (() => {
              const isLocalCreator =
                state.creatorInfo.creatorId === mediasoup.userId;
              if (isLocalCreator) {
                return (
                  mediasoup.localStream
                    ?.getVideoTracks()
                    .some((track) => track.enabled) ?? false
                );
              }
              return mediasoup.remoteStreams.some(
                (stream) =>
                  stream.peerId === state.creatorInfo?.creatorId &&
                  stream.kind === "video" &&
                  stream.source === "webcam"
              );
            })(),
          },
        ]
      : []),
    ...mediasoup.peers
      .filter((peer) => peer.id !== state.creatorInfo?.creatorId)
      .map((peer) => {
        const isLocalPeer = peer.id === mediasoup.userId;
        const cameraEnabled = isLocalPeer
          ? (mediasoup.localStream
              ?.getVideoTracks()
              .some((track) => track.enabled) ?? false)
          : mediasoup.remoteStreams.some(
              (stream) =>
                stream.peerId === peer.id &&
                stream.kind === "video" &&
                stream.source === "webcam"
            );

        return {
          id: peer.id,
          displayName: peer.displayName,
          isCreator: false,
          isMicOn: isLocalPeer
            ? isMicOn
            : !mediasoup.remoteStreams.find((s) => s.peerId === peer.id)?.muted,
          isCameraOn: cameraEnabled,
        };
      }),
  ];

  const openSidebarWithSection = (section: ActiveSection | null) => {
    const paramsCopy = new URLSearchParams(searchParams.toString());
    const isSameSectionActive = state.isChatOpen && activeSection === section;

    if (isSameSectionActive) {
      paramsCopy.delete("section");
      router.push(`?${paramsCopy.toString()}`);
      setActiveSection(null);
      dispatch({ type: "SET_CHAT_OPEN", payload: false });
      return;
    }

    paramsCopy.set("section", section || "");
    router.push(`?${paramsCopy.toString()}`);
    setActiveSection(section);
    if (!state.isChatOpen) {
      dispatch({ type: "SET_CHAT_OPEN", payload: true });
    }
    if (section === "chat") {
      dispatch({ type: "RESET_UNREAD_CHAT" });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center overflow-x-hidden">
      {!state.joined ? (
        <CallPreview />
      ) : (
        <>
          <CallVideoGrid />
          <MediaControls
            localStream={mediasoup.localStream}
            joined={state.joined}
            activeSection={activeSection}
            onHangup={handleHangup}
            isScreenSharing={isScreenSharing}
            onToggleScreenShare={handleToggleScreenShare}
            onToggleCamera={toggleCamera}
            onToggleMic={toggleMic}
            isMicOn={isMicOn}
            onToggleChat={() => openSidebarWithSection("chat")}
            onToggleParticipants={() => openSidebarWithSection("participants")}
            onDeviceChange={handleDeviceChange}
            videoDevices={videoDevices}
            audioDevices={audioDevices}
            selectedVideo={state.selectedVideo || ""}
            selectedAudio={state.selectedAudio || ""}
          />

          <ChatSidebar
            open={state.isChatOpen}
            onOpenChange={(open) => {
              if (!open) {
                const paramsCopy = new URLSearchParams(searchParams.toString());
                paramsCopy.delete("section");
                router.push(`?${paramsCopy.toString()}`);
                setActiveSection(null);
              }
              dispatch({ type: "SET_CHAT_OPEN", payload: open });
              if (open) {
                dispatch({ type: "RESET_UNREAD_CHAT" });
              }
            }}
            socket={mediasoup.socket}
            userId={mediasoup.userId}
            displayName={mediasoup.displayName}
            userAvatar={session.user.image || "/avatars/default.jpg"}
            participants={participants}
            activeSection={activeSection}
            onActiveSectionChange={openSidebarWithSection}
          />
        </>
      )}
    </div>
  );
}

export default function CallPage() {
  return <CallPageContent />;
}

interface RequestJoinToastProps {
  name: string;
  reqId: string;
  roomId: string;
  peerId: string;
  socket: WebSocket;
  requesterId: string;
  toastId: string | number;
}

const RequestJoinToast = ({
  name,
  reqId,
  roomId,
  peerId,
  socket,
  requesterId,
  toastId,
}: RequestJoinToastProps) => {
  const handleAccept = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/calls/${roomId}/approve-join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ requesterId: requesterId }),
        }
      );

      if (response.ok) {
        socket?.send(
          JSON.stringify({
            type: "acceptJoin",
            reqId,
            roomId,
            peerId,
          })
        );
        toast.dismiss(toastId);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to approve request");
      }
    } catch (error) {
      console.error("Error approving join request:", error);
      toast.error("Failed to approve request");
    }
  };

  const handleReject = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/calls/${roomId}/reject-join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ requesterId: peerId }),
        }
      );

      if (response.ok) {
        socket?.send(
          JSON.stringify({
            type: "rejectJoin",
            reqId,
            roomId,
            peerId,
          })
        );
        toast.success(`${name} has been rejected from joining the call`);
        toast.dismiss(toastId);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to reject request");
      }
    } catch (error) {
      console.error("Error rejecting join request:", error);
      toast.error("Failed to reject request");
    }
  };

  return (
    <div className="bg-sidebar flex size-full flex-col gap-2 rounded-lg border p-4">
      <p className="text-sm font-medium">
        <span className="font-bold">{name}</span> is requesting to join
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleAccept}>
          Accept
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleReject}
          className="bg-primary-red hover:bg-primary-red/80"
        >
          Reject
        </Button>
      </div>
    </div>
  );
};
