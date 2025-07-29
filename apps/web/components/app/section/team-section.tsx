"use client";

import { useModal } from "@/hooks/use-modal";
import { CALLS_QUERY, TEAMS_QUERY } from "@/lib/QUERIES";
import type { Team } from "@/lib/types";
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
import { LoadingButton } from "@call/ui/components/loading-button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const TeamSection = () => {
  const queryClient = useQueryClient();
  const { onOpen } = useModal();
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

  const { mutate: createCall, isPending: createCallPending } = useMutation({
    mutationFn: CALLS_QUERY.createCall,
    onSuccess: (data) => {
      toast.success("Call created successfully", {
        description: "Redirecting to call...",
      });
      router.push(`/app/call/${data.callId}`);
    },
    onError: (error) => {
      toast.error("Failed to create call");
    },
  });

  const startTeamMeeting = async (team: Team) => {
    createCall({
      name: `${team.name} Meeting`,
      members: team.members.map((m) => m.email),
    });
  };

  return (
    <div className="space-y-6 px-10">
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
                          onClick={() => onOpen("add-member-to-team", { team })}
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
                <LoadingButton
                  onClick={() => startTeamMeeting(team)}
                  loading={createCallPending}
                  className="w-full"
                >
                  Start Meeting
                </LoadingButton>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamSection;
