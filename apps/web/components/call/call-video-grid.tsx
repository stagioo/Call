"use client";

import { useCallSelector, useMediasoupSelector } from "@/contexts/call-context";
import { Icons } from "@call/ui/components/icons";
import { cn } from "@call/ui/lib/utils";
import { memo, useMemo } from "react";

const LocalVideo = memo(function LocalVideo({
  stream,
}: {
  stream: MediaStream;
}) {
  return (
    <div className="relative aspect-video max-h-[500px] min-h-[240px] w-auto overflow-hidden rounded-lg bg-black shadow-lg">
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
}: {
  stream: MediaStream;
  peerId: string;
  peerDisplayName?: string;
  muted?: boolean;
  keyId: string;
}) {
  return (
    <div
      className="relative aspect-video max-h-[500px] min-h-[240px] w-auto overflow-hidden rounded-lg bg-black shadow-lg"
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
        className="h-[240px] w-[320px] rounded-lg bg-black shadow-lg"
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

  const remoteVideoStreams = useMemo(() => {
    return remoteStreams.filter((stream) => {
      if (!stream?.stream) return false;
      const videoTracks = stream.stream.getVideoTracks();
      if (!videoTracks.length) return false;
      const hasValidTrack = videoTracks.some(
        (track) => track.readyState === "live" && track.enabled
      );
      const isVideoKind = stream.kind === "video";
      const isVideoSource = stream.source === "webcam";
      const isNotScreenShare = stream.source !== "screen";
      return isVideoSource && isVideoKind && hasValidTrack && isNotScreenShare;
    });
  }, [remoteStreams]);

  const remoteScreenStreams = useMemo(() => {
    return remoteStreams.filter((stream) => {
      if (!stream?.stream) return false;
      const videoTracks = stream.stream.getVideoTracks();
      if (!videoTracks.length) return false;
      const hasValidTrack = videoTracks.some(
        (track) => track.readyState === "live" && track.enabled
      );
      return (
        stream.source === "screen" && stream.kind === "video" && hasValidTrack
      );
    });
  }, [remoteStreams]);

  const peerAudioStatus = useMemo(() => {
    return remoteStreams.reduce(
      (acc, stream) => {
        if (stream.kind === "audio") {
          acc[stream.peerId] = { muted: stream.muted };
        }
        return acc;
      },
      {} as Record<string, { muted: boolean }>
    );
  }, [remoteStreams]);

  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-wrap items-center justify-center gap-4 p-4 transition-all duration-300 ease-in-out"
      )}
    >
      <div className="flex flex-wrap items-center justify-center gap-4">
        {localStream && <LocalVideo stream={localStream} />}

        {screenStream &&
          screenStream.getVideoTracks().length > 0 &&
          screenStream
            .getVideoTracks()
            .some((track) => track.readyState === "live" && track.enabled) && (
            <ScreenShareTile
              keyId="local-screen"
              stream={screenStream}
              label="Your screen"
            />
          )}

        {remoteVideoStreams.map(
          ({ stream, peerId, displayName: peerDisplayName, producerId }) => (
            <RemoteVideoTile
              key={producerId || peerId}
              keyId={producerId || peerId}
              stream={stream}
              peerId={peerId}
              peerDisplayName={peerDisplayName}
              muted={peerAudioStatus[peerId]?.muted}
            />
          )
        )}

        {remoteScreenStreams.map(
          ({ stream, peerId, displayName: peerDisplayName, producerId }) => {
            if (
              !stream
                ?.getVideoTracks()
                .some((track) => track.readyState === "live" && track.enabled)
            ) {
              return null;
            }
            return (
              <ScreenShareTile
                key={producerId || peerId}
                keyId={producerId || peerId}
                stream={stream}
                label={`${peerDisplayName || "User"}'s screen`}
              />
            );
          }
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
    </div>
  );
};
