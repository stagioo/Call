"use client";

import { useState, useEffect } from "react";
import { Button } from "@call/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@call/ui/components/card";
import { useSession } from "@/hooks/useSession";
import type { Team } from "@/lib/types";
import { Users, Play, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@call/ui/components/dropdown-menu";

export const TeamSection = () => {
  const { session, isLoading: sessionLoading } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:1284/api/teams", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setTeams(data.teams || []);
      } else {
        setError("Failed to load teams");
      }
    } catch (err) {
      setError("Network error loading teams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted && session?.user && !sessionLoading) {
      fetchTeams();
    }
  }, [mounted, session?.user, sessionLoading]);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="text-muted-foreground">
            Manage your teams and collaborate with others
          </p>
        </div>
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-muted-foreground">Loading teams...</p>
        </div>
      ) : error ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-red-500">{error}</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-center">
          <Users className="text-muted-foreground mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-medium">No teams yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first team to start collaborating
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team, index) => (
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
                        <DropdownMenuItem>Leave</DropdownMenuItem>
                        <DropdownMenuItem>Add users</DropdownMenuItem>
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
                <Button className="w-full" variant="outline">
                  Start Meeting
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamSection;
