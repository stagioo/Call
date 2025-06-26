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
    console.log(`VideoPlayer: ${isLocal ? "local" : "remote"} stream:`, stream);
    console.log(`VideoPlayer: Stream active:`, stream?.active);
    console.log(`VideoPlayer: Stream tracks:`, stream?.getTracks());

    if (videoRef.current && stream) {
      // Solo asignar srcObject si realmente cambió
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
      // play() solo cuando el video esté listo
      const handleLoadedMetadata = () => {
        videoRef.current?.play().catch(() => {});
      };
      videoRef.current.addEventListener("loadedmetadata", handleLoadedMetadata);
      return () => {
        videoRef.current?.removeEventListener(
          "loadedmetadata",
          handleLoadedMetadata
        );
      };
    }
  }, [stream]);
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
