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
  console.log({
    stream,
    isLocal,
    className,
  });
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
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
      const videoElement = videoRef.current;

      console.log(`[VideoPlayer] Current video element state:`, {
        readyState: videoElement.readyState,
        paused: videoElement.paused,
        currentSrc: videoElement.currentSrc,
        srcObject: videoElement.srcObject,
        videoWidth: videoElement.videoWidth,
        videoHeight: videoElement.videoHeight,
      });

      if (videoElement.srcObject) {
        videoElement.srcObject = null;
      }
      videoElement.srcObject = stream;
      console.log(`[VideoPlayer] Set new srcObject:`, {
        srcObject: videoElement.srcObject,
        streamActive: stream.active,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
      });

      // Try to play immediately and also wait for metadata
      const tryPlay = async () => {
        try {
          await videoElement.play();
          console.log(`[VideoPlayer] Immediate playback started`);
        } catch (error) {
          console.error(`[VideoPlayer] Immediate playback failed:`, error);
        }
      };
      tryPlay();

      const handleLoadedMetadata = async () => {
        console.log(`[VideoPlayer] Metadata loaded, attempting to play`);
        console.log(
          `[VideoPlayer] Video dimensions: ${videoElement.videoWidth}x${videoElement.videoHeight}`
        );
        try {
          await videoElement.play();
          console.log(
            `[VideoPlayer] Playback after metadata started successfully`
          );
        } catch (error) {
          console.error(`[VideoPlayer] Playback after metadata failed:`, error);
        }
      };

      const handleCanPlay = async () => {
        console.log(`[VideoPlayer] Can play event fired`);
        try {
          await videoElement.play();
          console.log(`[VideoPlayer] Playback on canplay started successfully`);
        } catch (error) {
          console.error(`[VideoPlayer] Playback on canplay failed:`, error);
        }
      };

      const handlePlay = () => {
        console.log(`[VideoPlayer] Play event fired - video is now playing`);
      };

      const handlePause = () => {
        console.log(`[VideoPlayer] Pause event fired - video is now paused`);
      };

      const handleError = (event: Event) => {
        console.error(`[VideoPlayer] Video error:`, event);
        const target = event.target as HTMLVideoElement;
        if (target.error) {
          console.error(`[VideoPlayer] Video error details:`, {
            code: target.error.code,
            message: target.error.message,
          });
        }
      };

      videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);
      videoElement.addEventListener("canplay", handleCanPlay);
      videoElement.addEventListener("play", handlePlay);
      videoElement.addEventListener("pause", handlePause);
      videoElement.addEventListener("error", handleError);

      return () => {
        const currentVideoElement = videoElement; // Store ref value
        currentVideoElement.removeEventListener(
          "loadedmetadata",
          handleLoadedMetadata
        );
        currentVideoElement.removeEventListener("canplay", handleCanPlay);
        currentVideoElement.removeEventListener("play", handlePlay);
        currentVideoElement.removeEventListener("pause", handlePause);
        currentVideoElement.removeEventListener("error", handleError);
      };
    } else if (videoRef.current && !stream) {
      console.log(`[VideoPlayer] No stream provided, clearing video element`);
      const videoElement = videoRef.current;
      videoElement.srcObject = null;
    }
  }, [stream, isLocal]);

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        width="100%"
        height="100%"
        style={{ backgroundColor: "#000" }}
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
