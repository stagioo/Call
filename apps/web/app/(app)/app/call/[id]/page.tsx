"use client";

import { CallPreview } from "@/components/call/call-preview";
import { CallVideoGrid } from "@/components/call/call-video-grid";
import { MediaControls } from "@/components/call/media-controls";
import { ChatSidebar } from "@/components/rooms/chat-sidebar";
import { ParticipantsSidebar } from "@/components/rooms/participants-sidebar";
import { CallProvider, useCallContext } from "@/contexts/call-context";
import { useCallDevices } from "@/hooks/use-call-devices";
import { useCallMediaControls } from "@/hooks/use-call-media-controls";
import { useCallProducers } from "@/hooks/use-call-producers";
import { useNotificationSound } from "@/hooks/use-notification-sound";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface JoinRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: Date;
}

function CallPageContent() {
  const params = useParams();
  const { state, dispatch, mediasoup } = useCallContext();
  const {
    toggleCamera,
    toggleMic,
    handleToggleScreenShare,
    handleHangup,
    isScreenSharing,
    isMicOn,
  } = useCallMediaControls();
  const { playNotificationSound } = useNotificationSound();
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
            onHangup={handleHangup}
            isScreenSharing={isScreenSharing}
            onToggleScreenShare={handleToggleScreenShare}
            onToggleCamera={toggleCamera}
            onToggleMic={toggleMic}
            isMicOn={isMicOn}
            onToggleChat={() =>
              dispatch({ type: "SET_CHAT_OPEN", payload: !state.isChatOpen })
            }
            onToggleParticipants={() =>
              dispatch({
                type: "SET_PARTICIPANTS_SIDEBAR_OPEN",
                payload: !state.isParticipantsSidebarOpen,
              })
            }
            onDeviceChange={handleDeviceChange}
            videoDevices={videoDevices}
            audioDevices={audioDevices}
            selectedVideo={state.selectedVideo || ""}
            selectedAudio={state.selectedAudio || ""}
          />

          <ParticipantsSidebar
            open={state.isParticipantsSidebarOpen}
            onOpenChange={(open) =>
              dispatch({ type: "SET_PARTICIPANTS_SIDEBAR_OPEN", payload: open })
            }
            callId={state.callId || ""}
            isCreator={state.isCreator}
            participants={participants}
            currentUserId={mediasoup.userId}
          />
          <ChatSidebar
            open={state.isChatOpen}
            onOpenChange={(open) =>
              dispatch({ type: "SET_CHAT_OPEN", payload: open })
            }
            socket={mediasoup.socket}
            userId={mediasoup.userId}
            displayName={state.creatorInfo?.creatorName || ""}
            participants={participants}
            currentUserId={mediasoup.userId}
          />
        </>
      )}
    </div>
  );
}

export default function CallPage() {
  return (
    <CallProvider>
      <CallPageContent />
    </CallProvider>
  );
}
