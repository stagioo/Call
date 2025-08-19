"use client";

import { useCallSelector, useMediasoupSelector } from "@/contexts/call-context";
import { Icons } from "@call/ui/components/icons";
import { cn } from "@call/ui/lib/utils";
import { type JSX, memo, useMemo } from "react";
import { motion as m } from "motion/react";

const LocalVideo = memo(function LocalVideo({
  stream,
  isScreenShare,
  peerId,
  keyId,
}: {
  stream: MediaStream;
  isScreenShare?: boolean;
  peerId: string;
  keyId: string;
}) {
  console.log("tileId local", keyId);
  return (
    <m.div
      layoutId={keyId}
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
    </m.div>
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
  console.log("tileId remote", keyId);
  return (
    <m.div
      layoutId={keyId}
      className={cn(
        "relative aspect-video max-h-[500px] min-h-[240px] w-auto overflow-hidden rounded-lg bg-black shadow-lg",
        isScreenShare && "aspect-video max-h-[200px] min-h-[200px] w-auto"
      )}
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
    </m.div>
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
  console.log("tileId screen", keyId, label);
  return (
    <m.div layoutId={keyId} className="relative size-full">
      <video
        autoPlay
        playsInline
        className="size-full rounded-lg bg-black shadow-lg"
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
    </m.div>
  );
});

export const CallVideoGrid = memo(() => {
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

  const allStreams = useMemo(() => {
    const streams: {
      id: string;
      stream: MediaStream;
      type: "webcam" | "screen";
      peerId: string;
      displayName?: string;
      muted?: boolean;
      isLocal?: boolean;
    }[] = [];

    if (localStream) {
      streams.push({
        id: "local-video",
        stream: localStream,
        type: "webcam",
        peerId: "local",
        displayName: "You",
        isLocal: true,
      });
    }

    if (
      screenStream &&
      screenStream
        .getVideoTracks()
        .some((track) => track.readyState === "live" && track.enabled)
    ) {
      streams.push({
        id: "local-screen",
        stream: screenStream,
        type: "screen",
        peerId: "local",
        displayName: "Your screen",
        isLocal: true,
      });
    }

    remoteStreams.forEach(
      ({ stream, peerId, displayName, producerId, kind, source, muted }) => {
        if (!stream) return;
        if (kind !== "video") return;

        const hasValidTrack = stream
          .getVideoTracks()
          .some((t) => t.readyState === "live" && t.enabled);
        if (!hasValidTrack) return;

        streams.push({
          id: producerId || peerId,
          stream,
          type: source === "screen" ? "screen" : "webcam",
          peerId,
          displayName,
          muted,
        });
      }
    );

    return streams;
  }, [localStream, screenStream, remoteStreams]);

  const allNormalStreams = allStreams.filter((s) => s.type === "webcam");
  const allScreenStreams = allStreams.filter((s) => s.type === "screen");

  const videoStreams = useMemo(() => {
    const videos: JSX.Element[] = [];

    if (localStream) {
      videos.push(
        <LocalVideo
          keyId="local-video"
          peerId="local"
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

  if (allNormalStreams.length <= 2 && allScreenStreams.length === 0)
    return <OneOrTwo streams={allNormalStreams} />;
  return (
    <div className="relative mb-20 flex h-[calc(100vh-100px)] w-full flex-col items-center justify-center gap-6 p-4">
      {screenShares.length > 0 && (
        <div className="flex flex-1 items-center justify-center gap-4">
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
});

CallVideoGrid.displayName = "CallVideoGrid";

interface OneOrTwoProps {
  streams: {
    id: string;
    stream: MediaStream;
    type: "webcam" | "screen";
    peerId: string;
    displayName?: string;
  }[];
}

const OneOrTwo = memo(({ streams }: OneOrTwoProps) => {
  const remoteAudios = useCallSelector((s) => s.remoteAudios);

  return (
    <div className="relative mb-20 flex h-[calc(100vh-100px)] flex-1 items-center justify-center gap-4 p-4">
      {streams.map(({ id, stream, type, peerId, displayName }) => (
        <m.div
          layoutId={id}
          key={id}
          className={cn("relative size-full overflow-hidden rounded-2xl", {
            "absolute bottom-8 right-8 z-10 max-h-[200px] max-w-[300px] rounded-lg":
              displayName === "You" && streams.length > 1,
          })}
        >
          <video
            autoPlay
            playsInline
            muted={displayName === "You"}
            className="size-full object-cover"
            ref={(el) => {
              if (el) {
                el.srcObject = stream;
                el.onloadedmetadata = () => {
                  el.play().catch((e) =>
                    console.warn(`Error playing video for ${displayName}:`, e)
                  );
                };
              }
            }}
          />
          <span className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
            {displayName}
          </span>
        </m.div>
      ))}
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
});
