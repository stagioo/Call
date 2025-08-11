import { Button, buttonVariants } from "@call/ui/components/button";
import { Icons } from "@call/ui/components/icons";
import { Input } from "@call/ui/components/input";
import { ScrollArea } from "@call/ui/components/scroll-area";
import { UserProfile } from "@call/ui/components/use-profile";
import { cn } from "@call/ui/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { X } from "lucide-react";
import { AnimatePresence, motion as m } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const CHAT_SECTIONS = [
  {
    key: "chat",
    label: "Chat",
  },
  {
    key: "participants",
    label: "Participants",
  },
];

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: number;
}

interface Participant {
  id: string;
  displayName: string;
  isCreator?: boolean;
  isMicOn?: boolean;
  isCameraOn?: boolean;
}

interface ChatSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  socket: WebSocket | null;
  userId: string;
  displayName: string;
  userAvatar?: string;
  participants?: Participant[];
  currentUserId?: string;
}

export function ChatSidebar({
  open,
  onOpenChange,
  socket,
  userId,
  displayName,
  userAvatar,
  participants = [],
  currentUserId,
}: ChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isParticipants = searchParams.get("section") === "participants";

  const activeSection = isParticipants ? "participants" : "chat";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "chat") {
          setMessages((prev) => [...prev, data.message]);
          setTimeout(scrollToBottom, 100);
        }
      } catch (err) {
        console.error("Error processing chat message:", err);
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [socket]);

  const sendMessage = () => {
    if (!socket || !inputValue.trim() || socket.readyState !== WebSocket.OPEN)
      return;

    const message: Message = {
      id: crypto.randomUUID(),
      text: inputValue.trim(),
      senderId: userId,
      senderName: displayName,
      senderAvatar: userAvatar,
      timestamp: Date.now(),
    };

    socket.send(
      JSON.stringify({
        type: "chat",
        message,
      })
    );

    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <m.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "500px", opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="bg-inset-accent border-sidebar-inset z-50 flex h-screen w-full flex-col"
        >
          <div className="flex items-center justify-between">
            <div className="border-inset-accent bg-sidebar-inset flex w-fit items-center justify-between gap-2 rounded-br-lg border p-1">
              {CHAT_SECTIONS.map((section) => (
                <m.button
                  whileTap={{ scale: 0.98 }}
                  key={section.key}
                  aria-pressed={
                    activeSection === (section.key as typeof activeSection)
                  }
                  aria-label={`Show ${section.label}`}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.set("section", section.key);
                    router.push(`?${params.toString()}`);
                  }}
                  className={cn(
                    "relative z-0",
                    buttonVariants({ variant: "ghost" }),
                    activeSection === section.key && "font-semibold",
                    "hover:bg-transparent! rounded-tr-none"
                  )}
                >
                  {section.label}
                  {activeSection === section.key && (
                    <m.div
                      className={cn(
                        "bg-sidebar-accent absolute inset-0 -z-10 rounded-md",
                        activeSection === "participants" && "rounded-tr-none",
                        activeSection === "chat" && "rounded-l-none"
                      )}
                      layoutId="active-call-section-indicator"
                    />
                  )}
                </m.button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              aria-label="Close sidebar"
            >
              <X />
            </Button>
          </div>
          <div className="h-full flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {activeSection === "chat" ? (
                <div className="flex flex-col gap-4 p-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.senderId === userId ? "flex-row-reverse" : ""
                      }`}
                    >
                      <UserProfile
                        name={message.senderName}
                        url={message.senderAvatar || ""}
                      />
                      <div
                        className={`flex max-w-[80%] flex-col ${
                          message.senderId === userId ? "items-end" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {message.senderId === userId
                              ? null
                              : message.senderName}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {formatDistanceToNow(message.timestamp, {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <div
                          className={`mt-1 rounded-lg px-3 py-2 ${
                            message.senderId === userId
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {message.text}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="flex flex-col gap-2 p-4">
                  {participants.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No participants
                    </p>
                  ) : (
                    participants.map((p) => (
                      <div
                        key={p.id}
                        className={cn(
                          "flex items-center gap-3 rounded-lg p-2",
                          p.id === currentUserId ? "bg-muted" : "bg-muted/50"
                        )}
                      >
                        <UserProfile name={p.displayName} url={""} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {p.id === currentUserId
                              ? `${p.displayName} (You)`
                              : p.displayName}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </ScrollArea>
          </div>

          {activeSection === "chat" && (
            <div className="border-sidebar-inset border-t p-2">
              <div className="bg-sidebar-inset flex items-center gap-2 rounded-lg border p-2">
                <Input
                  placeholder="Type a message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="border-none outline-none"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputValue.trim()}
                  size="icon"
                  aria-label="Send message"
                >
                  <Icons.thoughtsIcon />
                </Button>
              </div>
            </div>
          )}
        </m.div>
      )}
    </AnimatePresence>
  );
}
