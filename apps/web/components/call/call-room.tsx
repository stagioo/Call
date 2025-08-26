"use client";

import React from "react";
import { CallPreview } from "@/components/call/call-preview";
import { CallVideoGrid } from "@/components/call/call-video-grid";
import { MediaControls } from "@/components/call/media-controls";
import { ChatSidebar } from "@/components/rooms/chat-sidebar";
import { RequestJoinToast } from "@/components/toasts/request-join";
import { useCallContext } from "@/contexts/call-context";
import { useCallDevices } from "@/hooks/use-call-devices";
import { useCallJoin } from "@/hooks/use-call-join";
import { useCallMediaControls } from "@/hooks/use-call-media-controls";
import { useCallProducers } from "@/hooks/use-call-producers";
import { useNotificationSound } from "@/hooks/use-notification-sound";
import type { ActiveSection } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const CallRoomComponent = ({ id }: { id: string }) => {
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

  const handleJoinRequest = useCallback(
    (event: MessageEvent) => {
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
    },
    [state.isCreator, state.callId, mediasoup.socket, playNotificationSound]
  );

  const handleApproval = useCallback(
    async (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.type === "joinApproved" && data.roomId === state.callId) {
          if (state.joined || !state.callId) return;

          handleJoin();
        }
      } catch {}
    },
    [state.callId, state.joined, handleJoin]
  );

  useEffect(() => {
    if (!mediasoup.socket) return;

    mediasoup.socket.addEventListener("message", handleJoinRequest);
    return () => {
      mediasoup.socket?.removeEventListener("message", handleJoinRequest);
    };
  }, [mediasoup.socket, handleJoinRequest]);

  useEffect(() => {
    if (!mediasoup.socket) return;

    mediasoup.socket.addEventListener("message", handleApproval);
    return () => {
      mediasoup.socket?.removeEventListener("message", handleApproval);
    };
  }, [mediasoup.socket, handleApproval]);

  useEffect(() => {
    if (id) {
      dispatch({ type: "SET_CALL_ID", payload: id });
    }
  }, [id, dispatch]);

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

  const participants = useMemo(
    () => [
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
              : !mediasoup.remoteStreams.find((s) => s.peerId === peer.id)
                  ?.muted,
            isCameraOn: cameraEnabled,
          };
        }),
    ],
    [
      state.creatorInfo,
      mediasoup.userId,
      mediasoup.remoteStreams,
      mediasoup.peers,
      mediasoup.localStream,
      isMicOn,
    ]
  );

  const openSidebarWithSection = useCallback(
    (section: ActiveSection | null) => {
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
    },
    [searchParams, state.isChatOpen, activeSection, router, dispatch]
  );

  const handleChatSidebarOpenChange = useCallback(
    (open: boolean) => {
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
    },
    [searchParams, router, dispatch]
  );

  const handleToggleChat = useCallback(() => {
    openSidebarWithSection("chat");
  }, [openSidebarWithSection]);

  const handleToggleParticipants = useCallback(() => {
    openSidebarWithSection("participants");
  }, [openSidebarWithSection]);

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
            onToggleChat={handleToggleChat}
            onToggleParticipants={handleToggleParticipants}
            onDeviceChange={handleDeviceChange}
            videoDevices={videoDevices}
            audioDevices={audioDevices}
            selectedVideo={state.selectedVideo || ""}
            selectedAudio={state.selectedAudio || ""}
          />

          <ChatSidebar
            open={state.isChatOpen}
            onOpenChange={handleChatSidebarOpenChange}
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
};

export const CallRoom = React.memo(CallRoomComponent);
