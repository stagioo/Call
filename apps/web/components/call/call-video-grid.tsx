"use client";

import { useCallSelector, useMediasoupSelector } from "@/contexts/call-context";
import { Icons } from "@call/ui/components/icons";
import { cn } from "@call/ui/lib/utils";
import { type JSX, memo, useMemo } from "react";

const LocalVideo = memo(function LocalVideo({
  stream,
  isScreenShare,
}: {
  stream: MediaStream;
  isScreenShare?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative aspect-video max-h-[500px] min-h-[240px] w-auto overflow-hidden rounded-lg bg-black shadow-lg",
        isScreenShare && "aspect-video max-h-[200px] min-h-[200px] w-auto"
      )}
    >
      <video
        autoPlay
        playsInline
        muted
        className="size-full object-cover"
        ref={(el) => {
          if (el && stream) {
            el.srcObject = stream;
          }
        }}
      />
      <span className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
        You
      </span>
    </div>
  );
});

const RemoteVideoTile = memo(function RemoteVideoTile({
  stream,
  peerId,
  peerDisplayName,
  muted,
  keyId,
  isScreenShare,
}: {
  stream: MediaStream;
  peerId: string;
  peerDisplayName?: string;
  muted?: boolean;
  keyId: string;
  isScreenShare?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative aspect-video max-h-[500px] min-h-[240px] w-auto overflow-hidden rounded-lg bg-black shadow-lg",
        isScreenShare && "aspect-video max-h-[200px] min-h-[200px] w-auto"
      )}
      key={keyId}
    >
      <video
        autoPlay
        playsInline
        className="size-full object-cover"
        ref={(el) => {
          if (el && stream) {
            el.srcObject = stream;
            el.onloadedmetadata = () => {
              el.play().catch((e) =>
                console.warn(
                  `Error playing remote video for ${peerDisplayName}:`,
                  e
                )
              );
            };
          }
        }}
      />
      <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-white">
        <div className="flex items-center gap-2">
          <span className="text-xs">{peerDisplayName || "User"}</span>
          {muted && <Icons.micOffIcon className="size-4" />}
        </div>
      </div>
    </div>
  );
});

const ScreenShareTile = memo(function ScreenShareTile({
  stream,
  label,
  keyId,
}: {
  stream: MediaStream;
  label: string;
  keyId: string;
}) {
  return (
    <div className="relative" key={keyId}>
      <video
        autoPlay
        playsInline
        className="aspect-video w-auto rounded-lg bg-black shadow-lg"
        ref={(el) => {
          if (el) {
            el.srcObject = stream;
            el.onloadedmetadata = () => {
              el.play().catch((e) =>
                console.warn(`Error playing screen share for ${label}:`, e)
              );
            };
          }
        }}
      />
      <span className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
        {label}
      </span>
    </div>
  );
});

export const CallVideoGrid = () => {
  const screenStream = useCallSelector((s) => s.screenStream);
  const remoteAudios = useCallSelector((s) => s.remoteAudios);

  const localStream = useMediasoupSelector((m) => m.localStream);
  const remoteStreams = useMediasoupSelector((m) => m.remoteStreams);

  const screenShares = useMemo(() => {
    const screens: JSX.Element[] = [];

    if (
      screenStream &&
      screenStream
        .getVideoTracks()
        .some((track) => track.readyState === "live" && track.enabled)
    ) {
      screens.push(
        <ScreenShareTile
          keyId="local-screen"
          stream={screenStream}
          label="Your screen"
        />
      );
    }

    remoteStreams.forEach(
      ({
        stream,
        peerId,
        displayName: peerDisplayName,
        producerId,
        kind,
        source,
      }) => {
        if (!stream) return;
        if (kind !== "video" || source !== "screen") return;

        const hasValidTrack = stream
          .getVideoTracks()
          .some((track) => track.readyState === "live" && track.enabled);
        if (!hasValidTrack) return;

        screens.push(
          <ScreenShareTile
            key={producerId || peerId}
            keyId={producerId || peerId}
            stream={stream}
            label={`${peerDisplayName || "User"}'s screen`}
          />
        );
      }
    );

    return screens;
  }, [screenStream, remoteStreams]);

  const videoStreams = useMemo(() => {
    const videos: JSX.Element[] = [];

    if (localStream) {
      videos.push(
        <LocalVideo
          key="local-video"
          stream={localStream}
          isScreenShare={screenShares.length > 0}
        />
      );
    }

    remoteStreams.forEach(
      ({
        stream,
        peerId,
        displayName: peerDisplayName,
        producerId,
        kind,
        source,
      }) => {
        if (!stream) return;
        if (kind !== "video" || source !== "webcam") return;

        const hasValidTrack = stream
          .getVideoTracks()
          .some((track) => track.readyState === "live" && track.enabled);
        if (!hasValidTrack) return;

        videos.push(
          <RemoteVideoTile
            key={producerId || peerId}
            keyId={producerId || peerId}
            stream={stream}
            peerId={peerId}
            isScreenShare={screenShares.length > 0}
            peerDisplayName={peerDisplayName}
            muted={remoteStreams
              .filter((s) => s.kind === "audio" && s.peerId === peerId)
              .some((s) => s.muted)}
          />
        );
      }
    );

    return videos;
  }, [localStream, remoteStreams, screenShares]);

  return (
    <div className="relative flex h-[calc(100vh-100px)] w-full flex-col items-center justify-center gap-6 p-4">
      {screenShares.length > 0 && (
        <div className="flex flex-1 flex-wrap items-center justify-center gap-4">
          {screenShares}
        </div>
      )}
      {videoStreams.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-4">
          {videoStreams}
        </div>
      )}

      {remoteAudios.map(({ stream, id, peerId, displayName }) => (
        <audio
          key={id}
          autoPlay
          playsInline
          ref={(el) => {
            if (el) {
              el.srcObject = stream;
              el.onloadedmetadata = () => {
                el.play().catch((e) =>
                  console.warn(
                    `Error playing audio for ${displayName || peerId}:`,
                    e
                  )
                );
              };
            }
          }}
        />
      ))}
    </div>
  );
};
