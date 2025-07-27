"use client";

import { Avatar } from "@call/ui/components/avatar";
import { Button } from "@call/ui/components/button";
import { Input } from "@call/ui/components/input";
import { intervalToDuration } from "date-fns";
import { MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiX } from "react-icons/fi";
import { useSession } from "../../../../hooks/useSession";
import { Icons } from "@call/ui/components/icons";
import { iconvVariants, UserProfile } from "@call/ui/components/use-profile";
import { cn } from "@call/ui/lib/utils";
// import { es } from "date-fns/locale";

interface Participant {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

interface Call {
  id: string;
  name: string;
  creatorId: string;
  joinedAt: string;
  leftAt: string | null;
  participants: Participant[];
}

type FilterType = "all" | "my-calls" | "shared-with-me";

const formatCallDuration = (joinedAt: string, leftAt: string | null) => {
  const start = new Date(joinedAt);

  if (!leftAt) {
    return "Unknown duration";
  }

  const end = new Date(leftAt);

  const duration = intervalToDuration({ start, end });

  const parts = [];
  if (duration.hours && duration.hours > 0) parts.push(`${duration.hours}h`);
  if (duration.minutes && duration.minutes > 0)
    parts.push(`${duration.minutes}m`);
  if (duration.seconds && duration.seconds > 0)
    parts.push(`${duration.seconds}s`);

  return parts.length > 0 ? parts.join(" ") : "< 1s";
};

const ParticipantAvatars = ({
  participants,
}: {
  participants: Participant[];
}) => {
  const maxVisible = 4;
  const visibleParticipants = participants.slice(0, maxVisible);
  const remainingCount = participants.length - maxVisible;

  return (
    <div className="flex items-center justify-center gap-1">
      <span className="text-muted-foreground mr-2 text-xs">Participants:</span>
      <div className="flex -space-x-2">
        {visibleParticipants.map((participant) => (
          <div key={participant.id} className="group relative">
            <Avatar className="h-8 w-8 border-2 border-white dark:border-gray-900">
              {participant.image ? (
                <img
                  src={participant.image}
                  alt={participant.name || participant.email}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-medium text-white">
                  {(participant.name || participant.email)
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </Avatar>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 transform whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              {participant.name || participant.email}
            </div>
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full border-2 border-white dark:border-gray-900">
            <span className="text-muted-foreground text-xs font-medium">
              +{remainingCount}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export function CallHistory() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [isDeleting, setIsDeleting] = useState(false);
  const { session } = useSession();
  const router = useRouter();

  const getFilteredCalls = () => {
    let filteredCalls = calls;

    if (activeFilter === "my-calls") {
      filteredCalls = calls.filter(
        (call) => call.creatorId === session?.user?.id
      );
    } else if (activeFilter === "shared-with-me") {
      filteredCalls = calls.filter(
        (call) => call.creatorId !== session?.user?.id
      );
    }

    if (searchQuery) {
      filteredCalls = filteredCalls.filter(
        (call) =>
          call.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          call.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filteredCalls;
  };

  const filteredCalls = getFilteredCalls();

  // Remove duplicate calls by id
  const uniqueCalls = Array.from(
    new Map(filteredCalls.map((call) => [call.id, call])).values()
  );

  const clearSearch = () => {
    setSearchQuery("");
  };

  const deleteHistory = async () => {
    if (
      !confirm(
        "¿Estás seguro de que quieres borrar todo tu historial de llamadas? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch("http://localhost:1284/api/calls/participated", {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to delete call history");
      }

      // Clear the calls from state
      setCalls([]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error deleting call history"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteCallParticipation = async (callId: string) => {
    if (
      !confirm(
        "¿Estás seguro de que quieres eliminar esta llamada del historial?"
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:1284/api/calls/participated/${callId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error("Failed to delete call participation");
      }

      setCalls((prev) => prev.filter((call) => call.id !== callId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error deleting call participation"
      );
    }
  };

  const getFilterCounts = () => {
    const myCalls = calls.filter(
      (call) => call.creatorId === session?.user?.id
    ).length;
    const sharedWithMe = calls.filter(
      (call) => call.creatorId !== session?.user?.id
    ).length;

    return {
      all: calls.length,
      myCalls,
      sharedWithMe,
    };
  };

  const counts = getFilterCounts();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="relative mx-auto max-w-md">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search calls by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 transform"
              >
                <FiX className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <CallHistoryCard key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

const CallHistoryCard = () => {
  const numberOfParticipants = 10;
  const participantsToShow = 3;
  const remainingParticipants = numberOfParticipants - participantsToShow;

  return (
    <div className="bg-inset-accent flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium">Call Name</h1>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Icons.scheduleIcon className="size-4" />
            <span className="text-muted-foreground">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <Icons.timer className="size-4" />
            <span className="text-muted-foreground">30 mins</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Icons.users className="size-4" />
        <div className="flex items-center">
          {Array.from({ length: participantsToShow }).map((_, index) => (
            <UserProfile
              key={index}
              name="John Doe"
              size="sm"
              className={cn("border-inset-accent -ml-2 border", {
                "-ml-0": index === 0,
              })}
            />
          ))}
          {remainingParticipants > 0 && (
            <div
              className={cn(
                iconvVariants({ size: "sm" }),
                "bg-muted z-10 -ml-2 border"
              )}
            >
              <span className="text-xs">+{remainingParticipants}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
