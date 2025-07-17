"use client";

import { cn } from "@call/ui/lib/utils";
import {
  useLocalParticipant,
  TrackToggle,
  DisconnectButton,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  Phone,
  ScreenShareOff,
} from "lucide-react";
import { motion } from "motion/react";

function RoomControls() {
  const { localParticipant } = useLocalParticipant();
  const isMicOn = localParticipant?.isMicrophoneEnabled ?? false;
  const isCamOn = localParticipant?.isCameraEnabled ?? false;
  const isScreenShareOn = localParticipant?.isScreenShareEnabled ?? false;

  return (
    <div className="absolute bottom-8 left-0 right-0 z-10 flex justify-center">
      <div className="flex items-center gap-4 rounded-full bg-[#181818] px-3 py-2 shadow-[0px_1px_1px_0px_inset_rgba(255,255,255,0.2)]">
        {/* User profile */}
        <div className="flex h-10 w-10 items-center justify-center rounded-full">
          <div className="size-7 rounded-full bg-gradient-to-br from-pink-200 to-indigo-400" />
        </div>

        {/* Audio status */}
        <div className="flex h-10 w-10 items-center justify-center rounded-full">
          <AudioLinesIcon className="size-6" />
        </div>

        {/* Microphone toggle */}
        <TrackToggle
          source={Track.Source.Microphone}
          showIcon={false}
          style={{ padding: 0 }}
        >
          <div className="flex h-10 w-10 items-center justify-center">
            {isMicOn ? (
              <Mic className="size-6" strokeWidth={1.5} />
            ) : (
              <MicOff className="size-6 text-[#FF4D4D]" strokeWidth={1.5} />
            )}
          </div>
        </TrackToggle>

        {/* Screen share toggle */}
        <TrackToggle
          source={Track.Source.ScreenShare}
          showIcon={false}
          style={{ padding: 0 }}
        >
          <div className="flex h-10 w-10 items-center justify-center">
            {isScreenShareOn ? (
              <ScreenShare className="size-6" strokeWidth={1.5} />
            ) : (
              <ScreenShareOff className="size-6" strokeWidth={1.5} />
            )}
          </div>
        </TrackToggle>

        {/* Camera toggle */}
        <TrackToggle
          source={Track.Source.Camera}
          showIcon={false}
          style={{ padding: 0 }}
        >
          <div className="flex h-10 w-10 items-center justify-center">
            {isCamOn ? (
              <Video className="size-6" strokeWidth={1.5} />
            ) : (
              <VideoOff className="size-6" strokeWidth={1.5} />
            )}
          </div>
        </TrackToggle>

        {/* Disconnect button */}
        <DisconnectButton style={{ padding: "0" }}>
          <div className="mr-1.5 flex size-8 items-center justify-center rounded-full bg-[#FF4D4D] transition-colors hover:bg-[#FF3333]">
            <Phone className="size-5 rotate-[136deg]" strokeWidth={1.5} />
          </div>
        </DisconnectButton>
      </div>
    </div>
  );
}

export default RoomControls;

export interface AudioLinesIconProps
  extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const AudioLinesIcon = ({
  className,
  size = 28,
  ...props
}: AudioLinesIconProps) => {
  return (
    <div className={cn(className)} {...props}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 10v3" />
        <motion.path
          d="M6 6v11"
          animate={{
            d: ["M6 6v11", "M6 10v3", "M6 6v11"],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        />
        <motion.path
          d="M10 3v18"
          animate={{
            d: ["M10 3v18", "M10 9v5", "M10 3v18"],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
          }}
        />
        <motion.path
          d="M14 8v7"
          animate={{
            d: ["M14 8v7", "M14 6v11", "M14 8v7"],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
          }}
        />
        <motion.path
          d="M18 5v13"
          animate={{
            d: ["M18 5v13", "M18 7v9", "M18 5v13"],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        />
        <path d="M22 10v3" />
      </svg>
    </div>
  );
};

export { AudioLinesIcon };
