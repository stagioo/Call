import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  stream: MediaStream | null;
  isLocal?: boolean;
  className?: string;
}

export const VideoPlayer = ({
  stream,
  isLocal = false,
  className = "",
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Detailed stream logging
    console.log(`[VideoPlayer] ${isLocal ? "Local" : "Remote"} stream:`, {
      stream: stream,
      active: stream?.active,
      tracks: stream?.getTracks().map((track) => ({
        kind: track.kind,
        enabled: track.enabled,
        readyState: track.readyState,
        muted: track.muted,
      })),
    });

    if (videoRef.current && stream) {
      console.log(`[VideoPlayer] Current video element state:`, {
        readyState: videoRef.current.readyState,
        paused: videoRef.current.paused,
        currentSrc: videoRef.current.currentSrc,
        srcObject: videoRef.current.srcObject,
      });

      // Only assign srcObject if it has changed
      if (videoRef.current.srcObject !== stream) {
        console.log(`[VideoPlayer] Setting new srcObject`);
        videoRef.current.srcObject = stream;
      }

      // Play when metadata is loaded
      const handleLoadedMetadata = () => {
        console.log(`[VideoPlayer] Metadata loaded, attempting to play`);
        videoRef.current
          ?.play()
          .then(() => {
            console.log(`[VideoPlayer] Playback started successfully`);
          })
          .catch((error) => {
            console.error(`[VideoPlayer] Playback failed:`, error);
          });
      };

      videoRef.current.addEventListener("loadedmetadata", handleLoadedMetadata);
      return () => {
        videoRef.current?.removeEventListener(
          "loadedmetadata",
          handleLoadedMetadata
        );
      };
    }
  }, [stream, isLocal]);

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className="w-full h-full object-cover rounded-lg"
      />
      {isLocal && (
        <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          You
        </div>
      )}
      {!isLocal && (
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {stream ? (stream.active ? "Connected" : "Inactive") : "No video"}
        </div>
      )}
      {!isLocal && stream && (
        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          Tracks: {stream.getTracks().length}
        </div>
      )}
    </div>
  );
};
