"use client";

import { Card, CardContent, CardFooter } from "@call/ui/components/card";
import { Input } from "@call/ui/components/input";
import { Button } from "@call/ui/components/button";
import { Label } from "@call/ui/components/label";
import { useSession } from "@/hooks/useSession";
import { useState, useEffect } from "react";
import type { CreateTeamRequest } from "@/lib/types";

interface Contact {
  contactId: string;
  name: string;
  email: string;
}

export function CreateTeamModal({ onClose, onTeamCreated }: { 
  onClose?: () => void;
  onTeamCreated?: () => void;
}) {
  const { session, isLoading: sessionLoading } = useSession();
  const [teamName, setTeamName] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch contacts on component mount
  useEffect(() => {
    if (!mounted) return;
    
    const fetchContacts = async () => {
      try {
        const res = await fetch("http://localhost:1284/api/contacts", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setContacts(data.contacts || []);
        }
      } catch (err) {
        console.error("Failed to fetch contacts:", err);
      }
    };

    fetchContacts();
  }, [mounted]);

  const handleMemberToggle = (email: string) => {
    setSelectedMembers(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!teamName.trim()) {
      setError("Team name is required");
      return;
    }
    
    if (selectedMembers.length === 0) {
      setError("Select at least one member");
      return;
    }

    if (!session?.session?.token) {
      setError("Please sign in to create a team");
      return;
    }

    setLoading(true);
    try {
      const teamData: CreateTeamRequest = {
        name: teamName.trim(),
        members: selectedMembers,
      };

      const res = await fetch("http://localhost:1284/api/teams/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(teamData),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || "Failed to create team");
      } else {
        setSuccess(true);
        setTimeout(() => {
          onTeamCreated?.();
          onClose?.();
        }, 1200);
      }
    } catch (err) {
      setError("Network error, try again");
    } finally {
      setLoading(false);
    }
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-6  ">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                type="text"
                placeholder="Enter team name"
                required
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                disabled={loading || success}
              />
            </div>

            <div className="grid gap-2">
              <Label>Select Members</Label>
              <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                {contacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No contacts available
                  </p>
                ) : (
                  contacts.map((contact, index) => (
                    <div key={`${contact.contactId}-${index}`} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">{contact.email}</p>
                      </div>
                      <Button
                        type="button"
                        variant={selectedMembers.includes(contact.email) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleMemberToggle(contact.email)}
                        disabled={loading || success}
                      >
                        {selectedMembers.includes(contact.email) ? "Added" : "Add"}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}
            {success && <div className="text-green-600 text-sm">Team created! 🎉</div>}
          </div>

          <CardFooter className="flex-col gap-2 mt-6">
            <Button type="submit" className="w-full" disabled={loading || success}>
              {loading ? "Creating..." : success ? "Created!" : "Create Team"}
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={onClose} 
              type="button" 
              disabled={loading}
            >
              Cancel
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
} 