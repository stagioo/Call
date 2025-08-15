"use client";

import { CallPreview } from "@/components/call/call-preview";
import { CallVideoGrid } from "@/components/call/call-video-grid";
import { MediaControls } from "@/components/call/media-controls";
import { ChatSidebar } from "@/components/rooms/chat-sidebar";
import { useCallContext } from "@/contexts/call-context";
import { useCallDevices } from "@/hooks/use-call-devices";
import { useCallMediaControls } from "@/hooks/use-call-media-controls";
import { useCallProducers } from "@/hooks/use-call-producers";
import type { ActiveSection } from "@/lib/types";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function CallPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<ActiveSection | null>(
    null
  );
  const { state, dispatch, mediasoup } = useCallContext();
  const {
    toggleCamera,
    toggleMic,
    handleToggleScreenShare,
    handleHangup,
    isScreenSharing,
    isMicOn,
  } = useCallMediaControls();

  const { videoDevices, audioDevices, handleDeviceChange } = useCallDevices();

  useCallProducers();

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
            }}
            socket={mediasoup.socket}
            userId={mediasoup.userId}
            displayName={state.creatorInfo?.creatorName || ""}
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
