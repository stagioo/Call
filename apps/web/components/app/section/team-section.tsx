"use client";

import { useModal } from "@/hooks/use-modal";
import { CALLS_QUERY, TEAMS_QUERY } from "@/lib/QUERIES";
import type { Team } from "@/lib/types";
import { Button } from "@call/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@call/ui/components/card";
import { Badge } from "@call/ui/components/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@call/ui/components/avatar";
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
import { 
  MoreHorizontal, 
  Users, 
  UserPlus, 
  Video, 
  LogOut,
  Search,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";

export const TeamSection = () => {
  const queryClient = useQueryClient();
  const { onOpen } = useModal();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredTeams = teams?.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.members.some(member => 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  if (teamsLoading) {
    return (
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Teams</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your teams and collaborate with others
            </p>
          </div>
        </div>
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading teams...</p>
          </div>
        </div>
      </div>
    );
  }

  if (teamsError) {
    return (
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Teams</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your teams and collaborate with others
            </p>
          </div>
        </div>
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="rounded-full bg-red-50 p-3">
              <Users className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-red-500 text-sm">{teamsError.message}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Teams</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your teams and collaborate with others
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-72"
          />
        </div>
        <Badge variant="outline" className="bg-primary/5 text-primary">
          {teams?.length || 0} teams
        </Badge>
      </div>

      {filteredTeams.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-muted/50 p-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">
              {searchTerm ? "No teams found" : "No teams yet"}
            </h3>
            <p className="text-muted-foreground max-w-sm">
              {searchTerm 
                ? "Try adjusting your search terms" 
                : "Create your first team to start collaborating"
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => onOpen("create-team")}>
                <UserPlus className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeams.map((team: Team, index: number) => (
            <Card
              key={`${team.id}-${index}`}
              className="group transition-all duration-200 hover:shadow-md overflow-hidden"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-base truncate">
                      {team.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {team.members.length} member{team.members.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="start">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => deleteTeam(team.id)}
                        disabled={deleteTeamPending}
                        className="text-destructive"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Leave Team
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onOpen("add-member-to-team", { team })}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Members
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Members List */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Members:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {team.members.slice(0, 4).map((member) => (
                      <div
                        key={member.user_id}
                        className="flex items-center gap-2 bg-muted/50 rounded-lg px-2 py-1"
                      >
                                                                          <Avatar className="h-6 w-6 ring-1 ring-border">
                           <AvatarImage src={member.image || undefined} />
                           <AvatarFallback className="text-xs bg-muted">
                             {getInitials(member.name)}
                           </AvatarFallback>
                         </Avatar>
                      </div>
                    ))}
                    {team.members.length > 4 && (
                      <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-2 py-1">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs text-primary font-medium">
                            +{team.members.length - 4}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          more
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <LoadingButton
                  onClick={() => startTeamMeeting(team)}
                  loading={createCallPending}
                  className="w-full"
                >
                  <Video className="h-4 w-4 mr-2" />
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
