"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@call/ui/components/card";
import { Button } from "@call/ui/components/button";
import { Input } from "@call/ui/components/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@call/ui/components/tabs";
import { Separator } from "@call/ui/components/separator";
import { Avatar } from "@call/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@call/ui/components/dropdown-menu";
import {
  formatDistanceToNow,
  formatDuration,
  intervalToDuration,
} from "date-fns";
import {
  FiPhone,
  FiSearch,
  FiX,
  FiUsers,
  FiUser,
  FiGrid,
  FiTrash2,
  FiMoreVertical,
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useSession } from "../../../../hooks/useSession";
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

  // If leftAt is null, the call hasn't ended properly - show as unknown duration
  if (!leftAt) {
    return "Unknown duration";
  }

  const end = new Date(leftAt);

  const duration = intervalToDuration({ start, end });

  // Format duration in a human-readable way
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [isDeleting, setIsDeleting] = useState(false);
  const { session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const res = await fetch(
          "http://localhost:1284/api/calls/participated",
          {
            credentials: "include",
          }
        );
        if (!res.ok) throw new Error("Failed to fetch calls");
        const data = await res.json();
        setCalls(data.calls);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading calls");
      } finally {
        setLoading(false);
      }
    };

    fetchCalls();
  }, []);

  // Filter calls based on search query and filter type
  const getFilteredCalls = () => {
    let filteredCalls = calls;

    // Apply category filter
    if (activeFilter === "my-calls") {
      filteredCalls = calls.filter(
        (call) => call.creatorId === session?.user?.id
      );
    } else if (activeFilter === "shared-with-me") {
      filteredCalls = calls.filter(
        (call) => call.creatorId !== session?.user?.id
      );
    }

    // Apply search filter
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

      // Remove the call from state
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

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="bg-muted h-12"></CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-muted-foreground p-8 text-center">
        <p>Error: {error}</p>
        <p className="mt-2">Please try again later</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search Bar and Delete Button */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Call History</h2>
          {calls.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={deleteHistory}
              disabled={isDeleting}
              className="flex items-center gap-2"
            >
              <FiTrash2 className="h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete History"}
            </Button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative mx-auto max-w-md">
          <div className="relative">
            <FiSearch className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
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
      </div>

      {/* Filter Tabs */}
      <Tabs
        value={activeFilter}
        onValueChange={(value) => setActiveFilter(value as FilterType)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <FiGrid className="h-4 w-4" />
            All ({counts.all})
          </TabsTrigger>
          <TabsTrigger value="my-calls" className="flex items-center gap-2">
            <FiUser className="h-4 w-4" />
            My calls ({counts.myCalls})
          </TabsTrigger>
          <TabsTrigger
            value="shared-with-me"
            className="flex items-center gap-2"
          >
            <FiUsers className="h-4 w-4" />
            Shared with me ({counts.sharedWithMe})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeFilter} className="mt-6">
          {/* Results */}
          {uniqueCalls.length === 0 ? (
            <div className="text-muted-foreground p-8 text-center">
              {searchQuery ? (
                <>
                  <p>No calls found for "{searchQuery}" in this category</p>
                  <Button
                    variant="ghost"
                    onClick={clearSearch}
                    className="mt-2"
                  >
                    Clear search
                  </Button>
                </>
              ) : (
                <p>
                  {activeFilter === "all" && "No call history yet"}
                  {activeFilter === "my-calls" &&
                    "You haven't created any calls yet"}
                  {activeFilter === "shared-with-me" &&
                    "No calls have been shared with you yet"}
                </p>
              )}
            </div>
          ) : (
            <>
              {searchQuery && (
                <p className="text-muted-foreground mb-4 text-center text-sm">
                  Found {uniqueCalls.length} call
                  {uniqueCalls.length === 1 ? "" : "s"} for "{searchQuery}"
                </p>
              )}

              <div className="mx-auto flex max-w-full flex-wrap items-center space-y-8">
                {uniqueCalls.map((call) => (
                  <Card
                    key={call.id}
                    className="border-muted/60 bg-muted/40 relative mx-auto min-w-[340px] border px-8 py-7 transition-shadow hover:shadow-lg"
                  >
                    {/* Three dots menu */}
                    <div className="absolute right-4 top-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-muted h-8 w-8"
                          >
                            <FiMoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => deleteCallParticipation(call.id)}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <FiTrash2 className="mr-2 h-4 w-4" />
                            Eliminar del historial
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <CardHeader className="border-0 bg-transparent p-0">
                      <div className="flex w-full flex-col items-center gap-4">
                        <span className="bg-primary/10 text-primary mb-2 inline-flex h-14 w-14 items-center justify-center rounded-full">
                          <FiPhone size={28} />
                        </span>
                        <h3 className="break-words text-center text-xl font-semibold leading-tight">
                          {call.name}
                        </h3>
                        <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
                          <span className="font-mono">ID: {call.id}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="p-1 text-xs"
                            title="Copy Call ID"
                            onClick={() =>
                              navigator.clipboard.writeText(call.id)
                            }
                          >
                            📋
                          </Button>
                        </div>

                        {/* Horizontal Separator */}
                        <Separator className="w-full" />

                        {/* Participants Avatars */}
                        <ParticipantAvatars participants={call.participants} />

                        {/* Call type indicator */}
                        <div className="flex items-center gap-1 text-xs">
                          {call.creatorId === session?.user?.id ? (
                            <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-blue-600">
                              <FiUser className="h-3 w-3" />
                              Created by you
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-green-600">
                              <FiUsers className="h-3 w-3" />
                              Shared with you
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <time className="text-muted-foreground text-xs">
                            {call.leftAt
                              ? formatDistanceToNow(new Date(call.leftAt), {
                                  addSuffix: true,
                                })
                              : "Call in progress"}
                          </time>
                          <span className="text-primary text-xs font-medium">
                            Duration:{" "}
                            {formatCallDuration(call.joinedAt, call.leftAt)}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
