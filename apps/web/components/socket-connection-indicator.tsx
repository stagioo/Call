"use client";

import { useSocketContext } from "./providers/socket";
import { Zap, ZapOff } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@call/ui/components/tooltip";

const SocketConnectionIndicator = () => {
  const { connected } = useSocketContext();

  if (process.env.NODE_ENV === "production") return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="bg-background/50 fixed bottom-0 right-0 z-50 flex size-10 items-center justify-center backdrop-blur-sm">
          {connected ? (
            <Zap className="size-4 text-green-500" />
          ) : (
            <ZapOff className="size-4 text-red-500" />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {connected ? "Socket Connected" : "Socket Disconnected"}
      </TooltipContent>
    </Tooltip>
  );
};

export default SocketConnectionIndicator;
