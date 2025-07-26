"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@call/ui/components/sheet";
import { Button } from "@call/ui/components/button";
import { Avatar } from "@call/ui/components/avatar";
import { Separator } from "@call/ui/components/separator";
import { Badge } from "@call/ui/components/badge";
import { 
  FiUsers, 
  FiUserPlus, 
  FiCheck, 
  FiX, 
  FiMic, 
  FiMicOff, 
  FiVideo, 
  FiVideoOff,
  FiStar,
  FiClock
} from "react-icons/fi";

interface Participant {
  id: string;
  displayName: string;
  isCreator?: boolean;
  isMicOn?: boolean;
  isCameraOn?: boolean;
  connectionState?: string;
}

interface JoinRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: Date;
}

interface ParticipantsSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callId: string;
  isCreator: boolean;
  participants: Participant[];
  currentUserId: string;
}

export function ParticipantsSidebar({
  open,
  onOpenChange,
  callId,
  isCreator,
  participants,
  currentUserId,
}: ParticipantsSidebarProps) {
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(false);

  // Find creator participant
  const creator = participants.find(p => p.isCreator);

  // Fetch join requests (only for creators)
  useEffect(() => {
    if (!isCreator || !open) return;

    const fetchJoinRequests = async () => {
      try {
        const response = await fetch(`http://localhost:1284/api/calls/${callId}/join-requests`, {
          credentials: "include",
        });
        
        if (response.ok) {
          const data = await response.json();
          setJoinRequests(data.requests || []);
        }
      } catch (error) {
        console.error("Error fetching join requests:", error);
      }
    };

    fetchJoinRequests();
    
    // Poll for new requests every 5 seconds
    const interval = setInterval(fetchJoinRequests, 5000);
    return () => clearInterval(interval);
  }, [callId, isCreator, open]);

  const handleApproveRequest = async (userId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:1284/api/calls/${callId}/approve-join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ requesterId: userId }),
      });

      if (response.ok) {
        // Remove the request from the list
        setJoinRequests(prev => prev.filter(req => req.userId !== userId));
      } else {
        const data = await response.json();
        alert(data.error || "Failed to approve request");
      }
    } catch (error) {
      console.error("Error approving request:", error);
      alert("Failed to approve request");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (userId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:1284/api/calls/${callId}/reject-join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ requesterId: userId }),
      });

      if (response.ok) {
        // Remove the request from the list
        setJoinRequests(prev => prev.filter(req => req.userId !== userId));
      } else {
        const data = await response.json();
        alert(data.error || "Failed to reject request");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Failed to reject request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FiUsers className="h-5 w-5" />
            Participants
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Current Participants */}
          <div>
            {/* Meeting Creator */}
            {creator && (
              <div className="mb-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <FiStar className="h-4 w-4 text-yellow-500" />
                  Meeting Creator
                </h3>
                <div
                  className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200 dark:border-blue-800"
                >
                  <Avatar className="h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm font-medium ring-2 ring-white dark:ring-gray-900">
                      {creator.displayName.charAt(0).toUpperCase()}
                    </div>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                        {creator.id === currentUserId ? `${creator.displayName} (You)` : creator.displayName}
                      </p>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 dark:hover:bg-yellow-900">
                        <FiStar className="h-3 w-3 mr-1" />
                        Creator
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {creator.isMicOn ? (
                        <FiMic className="h-3 w-3 text-green-600 dark:text-green-500" />
                      ) : (
                        <FiMicOff className="h-3 w-3 text-red-500" />
                      )}
                      {creator.isCameraOn ? (
                        <FiVideo className="h-3 w-3 text-green-600 dark:text-green-500" />
                      ) : (
                        <FiVideoOff className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <h3 className="font-medium mb-3 flex items-center gap-2">
              <FiUsers className="h-4 w-4" />
              {creator && creator.id !== currentUserId ? "Other Participants" : "Participants"} ({participants.filter(p => !p.isCreator).length})
            </h3>
            <div className="space-y-2">
              {participants
                .filter(p => !p.isCreator)
                .map((participant) => (
                <div
                  key={participant.id}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    participant.id === currentUserId ? 'bg-blue-50' : 'bg-muted/50'
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                      {participant.displayName.charAt(0).toUpperCase()}
                    </div>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {participant.id === currentUserId ? `${participant.displayName} (You)` : participant.displayName}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {participant.isMicOn ? (
                        <FiMic className="h-3 w-3 text-green-600" />
                      ) : (
                        <FiMicOff className="h-3 w-3 text-red-500" />
                      )}
                      {participant.isCameraOn ? (
                        <FiVideo className="h-3 w-3 text-green-600" />
                      ) : (
                        <FiVideoOff className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Join Requests (only for creators) */}
          {isCreator && (
            <>
              <Separator />
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <FiUserPlus className="h-4 w-4" />
                  Join Requests
                  {joinRequests.length > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {joinRequests.length}
                    </Badge>
                  )}
                </h3>
                
                {joinRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No pending requests
                  </p>
                ) : (
                  <div className="space-y-3">
                    {joinRequests.map((request) => (
                      <div
                        key={request.id}
                        className="p-3 border rounded-lg bg-background"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                              {request.userName.charAt(0).toUpperCase()}
                            </div>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {request.userName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {request.userEmail}
                            </p>
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <FiClock className="h-3 w-3" />
                              {new Date(request.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            onClick={() => handleApproveRequest(request.userId)}
                            disabled={loading}
                            className="flex-1"
                          >
                            <FiCheck className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectRequest(request.userId)}
                            disabled={loading}
                            className="flex-1"
                          >
                            <FiX className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
} 