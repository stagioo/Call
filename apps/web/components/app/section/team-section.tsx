"use client";

import { useState, useEffect } from "react";
import { Button } from "@call/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@call/ui/components/card";
import { useSession } from "@/hooks/useSession";
import type { Team } from "@/lib/types";
import { Users, Play } from "lucide-react";

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
            <p className="text-muted-foreground">Manage your teams and collaborate with others</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-64">
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
          <p className="text-muted-foreground">Manage your teams and collaborate with others</p>
        </div>
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">Loading teams...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-32">
          <p className="text-red-500">{error}</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No teams yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first team to start collaborating
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team, index) => (
            <Card key={`${team.id}-${index}`} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{team.name}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Members List */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Members:</p>
                  <div className="space-y-1">
                    {team.members.slice(0, 3).map((member) => (
                      <div key={member.user_id} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{member.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        </div>
                      </div>
                    ))}
                    {team.members.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{team.members.length - 3} more member{team.members.length - 3 !== 1 ? 's' : ''}
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
