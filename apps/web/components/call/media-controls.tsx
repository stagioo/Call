import { useCallContext } from "@/contexts/call-context";
import { useOrigin } from "@/hooks/use-origin";
import { Button } from "@call/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@call/ui/components/dropdown-menu";
import { Icons } from "@call/ui/components/icons";
import {
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_ICON,
  useSidebar,
} from "@call/ui/components/sidebar";
import { copyVariants } from "@/lib/constants";
import type { ActiveSection } from "@/lib/types";
import { cn } from "@call/ui/lib/utils";
import {
  AnimatePresence,
  motion as m,
  motion,
  MotionConfig,
  type HTMLMotionProps,
} from "motion/react";
import { useEffect, useState } from "react";
import { FiChevronDown, FiMonitor, FiVideoOff } from "react-icons/fi";
import { toast } from "sonner";

interface MediaControlsProps {
  localStream: MediaStream | null;
  joined: boolean;
  onHangup: () => void;
  isScreenSharing: boolean;
  onToggleScreenShare: () => void;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  isMicOn: boolean;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onDeviceChange: (type: "video" | "audio", deviceId: string) => void;
  videoDevices: MediaDeviceInfo[];
  audioDevices: MediaDeviceInfo[];
  selectedVideo: string;
  activeSection: ActiveSection | null;
  selectedAudio: string;
}

export const MediaControls = ({
  localStream,
  joined,
  onHangup,
  isScreenSharing,
  onToggleScreenShare,
  onToggleCamera,
  onToggleMic,
  isMicOn,
  onToggleChat,
  onToggleParticipants,
  onDeviceChange,
  videoDevices,
  audioDevices,
  selectedVideo,
  activeSection,
  selectedAudio,
}: MediaControlsProps) => {
  const [isCameraOn, setIsCameraOn] = useState(true);
  const { state } = useSidebar();
  const {
    state: { isChatOpen },
  } = useCallContext();

  useEffect(() => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();

      if (videoTracks.length > 0 && videoTracks[0]) {
        setIsCameraOn(videoTracks[0].enabled);
      }
    }
  }, [localStream]);

  const handleToggleCamera = () => {
    onToggleCamera();
    setIsCameraOn((prev) => !prev);
  };

  const handleDeviceChange = (type: "video" | "audio", deviceId: string) => {
    onDeviceChange(type, deviceId);
  };

  return (
    <div className="fixed bottom-0 left-0 flex h-20 w-full items-center justify-center">
      <div
        className="pointer-events-none h-full w-full transition-all duration-300 ease-in-out"
        style={{
          width: state === "expanded" ? SIDEBAR_WIDTH : SIDEBAR_WIDTH_ICON,
        }}
      />
      <div className="z-10 z-50 flex flex-1 items-center justify-between px-10">
        <CopyButton />
        <div className="flex items-center justify-center gap-2.5">
          <ControlButton
            className={cn(
              !isCameraOn &&
                "bg-primary-red/10 border-primary-red/10 hover:bg-primary-red/10 hover:text-primary-red"
            )}
          >
            <button
              onClick={handleToggleCamera}
              aria-label={isCameraOn ? "Turn camera off" : "Turn camera on"}
            >
              {isCameraOn ? (
                <Icons.videoIcon className="size-5" />
              ) : (
                <FiVideoOff className="fill-primary-red stroke-primary-red size-5 transition-all duration-300" />
              )}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2.5"
                  aria-label="Select camera device"
                >
                  <span className="text-lg">Camera</span>
                  <FiChevronDown size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                className="bg-inset-accent mb-2 space-y-1 rounded-xl shadow-none"
              >
                {videoDevices.map((device) => (
                  <DropdownMenuItem
                    key={device.deviceId}
                    onClick={() => handleDeviceChange("video", device.deviceId)}
                    className={cn(
                      "hover:bg-muted/50! cursor-pointer rounded-lg transition-all duration-300",
                      selectedVideo === device.deviceId && "bg-muted/50"
                    )}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="truncate">
                        {device.label ||
                          `Camera (${device.deviceId.slice(0, 8)}...)`}
                      </span>
                      {selectedVideo === device.deviceId && (
                        <div className="ml-2 h-2 w-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </ControlButton>
          <ControlButton
            className={cn(
              !isMicOn &&
                "bg-primary-red/10 border-primary-red/10 hover:bg-primary-red/10 hover:text-primary-red"
            )}
          >
            <button
              onClick={onToggleMic}
              aria-label={isMicOn ? "Mute microphone" : "Unmute microphone"}
            >
              {isMicOn ? (
                <Icons.micIcon className="size-5" />
              ) : (
                <Icons.micOffIcon className="size-5" fill="fill-primary-red" />
              )}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2.5"
                  aria-label="Select microphone device"
                >
                  <span className="text-lg">Microphone</span>
                  <FiChevronDown size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                className="bg-inset-accent mb-2 space-y-1 rounded-xl shadow-none"
              >
                {audioDevices.map((device) => (
                  <DropdownMenuItem
                    key={device.deviceId}
                    onClick={() => handleDeviceChange("audio", device.deviceId)}
                    className={cn(
                      "hover:bg-muted/50! cursor-pointer rounded-lg transition-all duration-300",
                      selectedAudio === device.deviceId && "bg-muted/50"
                    )}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="truncate">
                        {device.label ||
                          `Microphone (${device.deviceId.slice(0, 8)}...)`}
                      </span>
                      {selectedAudio === device.deviceId && (
                        <div className="ml-2 h-2 w-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </ControlButton>

          <ControlButton
            className={cn(
              isScreenSharing &&
                "border-primary-blue bg-primary-blue hover:bg-primary-blue"
            )}
            onClick={onToggleScreenShare}
          >
            <FiMonitor
              className={cn(
                "fill-primary-icon stroke-primary-icon size-5 transition-all duration-300",
                isScreenSharing && "fill-white stroke-white"
              )}
            />
          </ControlButton>

          <ControlButton
            onClick={onToggleParticipants}
            className={cn(
              activeSection === "participants" &&
                "border-primary-blue bg-primary-blue"
            )}
          >
            <Icons.users
              className="fill-primary-icon size-5"
              fill={cn(
                activeSection === "participants" && "fill-white stroke-white"
              )}
            />
          </ControlButton>

          <ControlButton
            onClick={onToggleChat}
            className={cn(
              activeSection === "chat" && "border-primary-blue bg-primary-blue"
            )}
          >
            <Icons.messageIcon
              className="size-5"
              fill={cn(activeSection === "chat" && "fill-white")}
            />
          </ControlButton>

          <ControlButton
            onClick={onHangup}
            className="border-primary-red bg-primary-red"
          >
            <Icons.phoneIcon className="size-5" fill="fill-white" />
          </ControlButton>
        </div>
        <div></div>
      </div>
      <div
        className="pointer-events-none h-full w-full bg-red-500 duration-500 ease-in-out"
        style={{
          width: isChatOpen ? 500 : 0,
        }}
      />
    </div>
  );
};

const ControlButton = (props: HTMLMotionProps<"div">) => {
  const { className, ...rest } = props;
  return (
    <m.div
      className={cn(
        "bg-inset-accent flex min-h-[46px] min-w-[58px] cursor-pointer items-center justify-center gap-2.5 rounded-3xl border px-4 py-2.5",
        className
      )}
      {...rest}
      whileTap={{ scale: 0.98 }}
    />
  );
};

const CopyButton = () => {
  const origin = useOrigin();
  const [copying, setCopying] = useState(false);
  const [copyingCallId, setCopyingCallId] = useState(false);
  const {
    state: { callId },
  } = useCallContext();
  const handleCopyInviteLink = () => {
    setCopying(true);
    const url = `${origin}/app/call/${callId}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied to clipboard");
    setTimeout(() => {
      setCopying(false);
    }, 2000);
  };

  const handleCopyCallId = () => {
    if (callId) {
      setCopyingCallId(true);
      navigator.clipboard.writeText(callId);
      toast.success("Call ID copied to clipboard");
      setTimeout(() => {
        setCopyingCallId(false);
      }, 2000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button onClick={handleCopyInviteLink} size="icon" variant="ghost">
        <MotionConfig transition={{ duration: 0.15 }}>
          <AnimatePresence initial={false} mode="wait">
            {copying ? (
              <motion.div
                animate="visible"
                exit="hidden"
                initial="hidden"
                key="check"
                variants={copyVariants}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  shapeRendering="geometricPrecision"
                >
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
              </motion.div>
            ) : (
              <motion.div
                animate="visible"
                exit="hidden"
                initial="hidden"
                key="copy"
                variants={copyVariants}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  shapeRendering="geometricPrecision"
                >
                  <path d="M8 17.929H6c-1.105 0-2-.912-2-2.036V5.036C4 3.91 4.895 3 6 3h8c1.105 0 2 .911 2 2.036v1.866m-6 .17h8c1.105 0 2 .91 2 2.035v10.857C20 21.09 19.105 22 18 22h-8c-1.105 0-2-.911-2-2.036V9.107c0-1.124.895-2.036 2-2.036z"></path>
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
        </MotionConfig>
      </Button>
      <div className="bg-border h-6 w-px" />
      <Button
        variant="secondary"
        onClick={handleCopyCallId}
        className="text-muted-foreground bg-sidebar-accent border-border whitespace-pre rounded-lg border px-2 py-1"
      >
        <AnimatePresence mode="popLayout">
          {copyingCallId ? (
            <m.span
              animate="visible"
              exit="hidden"
              initial="hidden"
              variants={copyVariants}
            >
              <m.span>Copied</m.span>
            </m.span>
          ) : (
            <m.span
              animate="visible"
              exit="hidden"
              initial="hidden"
              variants={copyVariants}
            >
              {callId}
            </m.span>
          )}
        </AnimatePresence>
      </Button>
    </div>
  );
};

export default MediaControls;
