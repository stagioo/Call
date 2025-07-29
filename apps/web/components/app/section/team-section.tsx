"use client";

import { useSession } from "@/hooks/useSession";
import type { Team } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@call/ui/components/alert-dialog";
import { Button } from "@call/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@call/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@call/ui/components/dropdown-menu";
import { MoreHorizontal, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TEAMS_QUERY } from "@/lib/QUERIES";
import { toast } from "sonner";

export const TeamSection = () => {
  const queryClient = useQueryClient();
  const { session, isLoading: sessionLoading } = useSession();
  const [mounted, setMounted] = useState(false);
  const [addUsersOpen, setAddUsersOpen] = useState<string | null>(null); // teamId or null
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [startingMeeting, setStartingMeeting] = useState<string | null>(null);
  const router = useRouter();

  const {
    data: teams,
    isLoading: teamsLoading,
    error: teamsError,
  } = useQuery({
    queryKey: ["teams"],
    queryFn: TEAMS_QUERY.getTeams,
  });

  const { mutate: deleteTeam, isPending: deleteTeamPending } = useMutation({
    mutationFn: TEAMS_QUERY.deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Team deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message);
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const startTeamMeeting = async (team: Team) => {
    try {
      setStartingMeeting(team.id);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/calls/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: `${team.name} Meeting`,
            members: team.members.map((m) => m.email),
            teamId: team.id,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Failed to start meeting");
        return;
      }

      const data = await res.json();
      router.push(`/app/call/${data.callId}`);
    } catch (err) {
      alert("Network error starting meeting");
    } finally {
      setStartingMeeting(null);
    }
  };

  // Fetch contacts only when modal opens
  useEffect(() => {
    if (addUsersOpen) {
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/contacts`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => setContacts(data.contacts || []));
    }
  }, [addUsersOpen]);

  const handleAddUsers = async () => {
    if (!addUsersOpen) return;
    setAddLoading(true);
    setAddError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/teams/${addUsersOpen}/add-members`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ emails: selectedContacts }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setAddError(data.message || "Failed to add users");
      } else {
        setAddUsersOpen(null);
        setSelectedContacts([]);
        // Invalidate teams query to refresh the list
        queryClient.invalidateQueries({ queryKey: ["teams"] });
      }
    } catch (err) {
      setAddError("Network error adding users");
    } finally {
      setAddLoading(false);
    }
  };

  // Show loading state during initial mount to prevent hydration mismatch
  if (!mounted || sessionLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Teams</h1>
            <p className="text-muted-foreground">
              Manage your teams and collaborate with others
            </p>
          </div>
        </div>
        <div className="flex h-32 items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Please sign in to view teams</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="text-muted-foreground">
            Manage your teams and collaborate with others
          </p>
        </div>
      </div>

      {teamsLoading ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-muted-foreground">Loading teams...</p>
        </div>
      ) : teamsError ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-red-500">{teamsError.message}</p>
        </div>
      ) : teams?.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-center">
          <Users className="text-muted-foreground mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-medium">No teams yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first team to start collaborating
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams?.map((team: Team, index: number) => (
            <Card
              key={`${team.id}-${index}`}
              className="transition-shadow hover:shadow-md"
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{team.name}</span>
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground bg-muted rounded px-2 py-1 text-xs">
                      {team.members.length} member
                      {team.members.length !== 1 ? "s" : ""}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56" align="start">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => deleteTeam(team.id)}
                          disabled={deleteTeamPending}
                        >
                          Leave
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setAddUsersOpen(team.id)}
                        >
                          Add users
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Members List */}
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm font-medium">
                    Members:
                  </p>
                  <div className="space-y-1">
                    {team.members.slice(0, 3).map((member) => (
                      <div
                        key={member.user_id}
                        className="flex items-center justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">{member.name}</p>
                          <p className="text-muted-foreground truncate text-xs">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    ))}
                    {team.members.length > 3 && (
                      <p className="text-muted-foreground text-xs">
                        +{team.members.length - 3} more member
                        {team.members.length - 3 !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => startTeamMeeting(team)}
                  disabled={startingMeeting === team.id}
                >
                  {startingMeeting === team.id
                    ? "Starting..."
                    : "Start Meeting"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal for adding users to team */}
      <AlertDialog
        open={!!addUsersOpen}
        onOpenChange={(open: boolean) => {
          if (!open) setAddUsersOpen(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add users to team</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-2">
            {contacts.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No contacts available
              </p>
            ) : (
              contacts.map((contact, idx) => (
                <div
                  key={contact.id || contact.email || idx}
                  className="hover:bg-muted flex items-center justify-between rounded p-2"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {contact.name || contact.email}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {contact.email}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={
                      selectedContacts.includes(contact.email)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setSelectedContacts((prev) =>
                        prev.includes(contact.email)
                          ? prev.filter((e) => e !== contact.email)
                          : [...prev, contact.email]
                      )
                    }
                    disabled={addLoading}
                  >
                    {selectedContacts.includes(contact.email) ? "Added" : "Add"}
                  </Button>
                </div>
              ))
            )}
          </div>
          {addError && (
            <div className="mt-2 text-sm text-red-500">{addError}</div>
          )}
          <div className="mt-4 flex flex-col gap-3">
            <Button
              onClick={handleAddUsers}
              disabled={addLoading || selectedContacts.length === 0}
              className="w-full"
            >
              {addLoading ? "Adding..." : "Add Selected"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setAddUsersOpen(null)}
              className="w-full"
              type="button"
              disabled={addLoading}
            >
              Cancel
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeamSection;
