"use client";

import { useSession } from "@/components/providers/session";
import { Skeletons } from "@/components/skeletons";
import { useModal } from "@/hooks/use-modal";
import { CALLS_QUERY } from "@/lib/QUERIES";
import type { Call } from "@/lib/types";
import { formatCallDuration, formatCustomDate } from "@/lib/utils";
import { Button } from "@call/ui/components/button";
import { Icons } from "@call/ui/components/icons";
import { Input } from "@call/ui/components/input";
import { iconvVariants, UserProfile } from "@call/ui/components/use-profile";
import { cn } from "@call/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { MoreVertical, X } from "lucide-react";
import { useState } from "react";

type FilterType = "all" | "my-calls" | "shared-with-me";

export function CallHistory() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const { user } = useSession();

  const {
    data: response,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["calls"],
    queryFn: () => CALLS_QUERY.getCalls(),
  });

  const getFilteredCalls = () => {
    let filteredCalls = calls;

    if (activeFilter === "my-calls") {
      filteredCalls = calls.filter((call) => call.creatorId === user.id);
    } else if (activeFilter === "shared-with-me") {
      filteredCalls = calls.filter((call) => call.creatorId !== user.id);
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

  // const deleteHistory = async () => {
  //   if (
  //     !confirm(
  //       "¿Estás seguro de que quieres borrar todo tu historial de llamadas? Esta acción no se puede deshacer."
  //     )
  //   ) {
  //     return;
  //   }

  //   // setIsDeleting(true);
  //   try {
  //     const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/calls/participated`, {
  //       method: "DELETE",
  //       credentials: "include",
  //     });

  //     if (!res.ok) {
  //       throw new Error("Failed to delete call history");
  //     }

  //     // Clear the calls from state
  //     setCalls([]);
  //   } catch (err) {
  //     setError(
  //       err instanceof Error ? err.message : "Error deleting call history"
  //     );
  //   } finally {
  //     // setIsDeleting(false);
  //   }
  // };

  // const deleteCallParticipation = async (callId: string) => {
  //   if (
  //     !confirm(
  //       "¿Estás seguro de que quieres eliminar esta llamada del historial?"
  //     )
  //   ) {
  //     return;
  //   }

  //   try {
  //     const res = await fetch(
  //       `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/calls/participated/${callId}`,
  //       {
  //         method: "DELETE",
  //         credentials: "include",
  //       }
  //     );

  //     if (!res.ok) {
  //       throw new Error("Failed to delete call participation");
  //     }

  //     setCalls((prev) => prev.filter((call) => call.id !== callId));
  //   } catch (err) {
  //     setError(
  //       err instanceof Error ? err.message : "Error deleting call participation"
  //     );
  //   }
  // };

  const getFilterCounts = () => {
    const myCalls = calls.filter((call) => call.creatorId === user.id).length;
    const sharedWithMe = calls.filter(
      (call) => call.creatorId !== user.id
    ).length;

    return {
      all: calls.length,
      myCalls,
      sharedWithMe,
    };
  };

  const counts = getFilterCounts();

  const isHavingCalls = response && response.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        {isHavingCalls || isLoading ? (
          <div className="flex items-center gap-2">
            <div className="relative w-full max-w-md">
              <Input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="placeholder:text-primary bg-inset-accent border-inset-accent-foreground h-12 border-2 px-10"
              />
              <Icons.search className="text-muted-foreground absolute left-3 top-1/2 size-5 -translate-y-1/2" />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearSearch}
                  className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 transform"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="bg-inset-accent-foreground hover:bg-inset-accent-foreground/80 size-12"
                variant="ghost"
              >
                <Icons.filter className="size-" />
                <span className="sr-only">Filter</span>
              </Button>
            </div>
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 10 }).map((_, index) => (
              <Skeletons.callHistory key={index} />
            ))
          ) : response && response.length > 0 ? (
            response.map((call) => (
              <CallHistoryCard key={call.id} call={call} />
            ))
          ) : (
            <NoCallsFound />
          )}
        </div>
      </div>
    </div>
  );
}

interface CallHistoryCardProps {
  call: Call;
}

const CallHistoryCard = ({ call }: CallHistoryCardProps) => {
  const participantsToShow = 3;
  const remainingParticipants = call.participants.length - participantsToShow;

  return (
    <div className="bg-inset-accent flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium first-letter:uppercase">
          {call.name}
        </h1>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Icons.scheduleIcon className="size-4" />
            <span className="text-muted-foreground">
              {formatCustomDate(call.joinedAt)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Icons.timer className="size-4" />
            <span className="text-muted-foreground">
              {formatCallDuration(call.joinedAt, call.leftAt)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Icons.users className="size-4" />
        <div className="flex items-center">
          {call.participants
            .slice(0, participantsToShow)
            .map((participant, index) => (
              <UserProfile
                key={index}
                name={participant.name}
                url={participant.image}
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

const NoCallsFound = () => {
  const { onOpen } = useModal();
  const { user } = useSession();
  return (
    <div className="bg-inset-accent border-inset-accent-foreground col-span-full flex h-96 flex-col items-center justify-center gap-4 rounded-xl border p-4 text-center">
      <div className="flex flex-col items-center">
        <h1 className="text-lg font-medium">
          Ops <span className="first-letter:uppercase">{user.name}</span>! You
          don&apos;t have any calls yet.
        </h1>
        <p className="text-muted-foreground">
          You can create a call to start a conversation with your friends.
        </p>
      </div>
      <Button
        onClick={() => onOpen("start-call")}
        className="bg-muted-foreground hover:bg-muted-foreground/80"
      >
        Start a call
      </Button>
    </div>
  );
};
