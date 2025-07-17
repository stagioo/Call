"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@call/ui/components/card";
import { Button } from "@call/ui/components/button";

interface Notification {
  id: string;
  message: string;
  callId: string | null;
  callName?: string | null;
  invitationId?: string | null;
  invitationStatus?: string | null;
  inviterName?: string | null;
  inviterEmail?: string | null;
  createdAt: string;
}

const NotificationSection = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("http://localhost:1284/api/notifications", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load notifications");
        const data = await res.json();
        setNotifications(data.notifications || []);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleAccept = async (invitationId?: string, callId?: string | null) => {
    if (!invitationId || !callId) return;
    setActionLoading(invitationId);
    try {
      const res = await fetch(`http://localhost:1284/api/calls/invitations/${invitationId}/accept`, {
        method: "PATCH",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.callId) {
        router.push(`/call/${data.callId}`);
      } else {
        setError(data.message || "Could not accept invitation");
      }
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (invitationId?: string) => {
    if (!invitationId) return;
    setActionLoading(invitationId);
    try {
      const res = await fetch(`http://localhost:1284/api/calls/invitations/${invitationId}/reject`, {
        method: "PATCH",
        credentials: "include",
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.invitationId !== invitationId));
      } else {
        const data = await res.json();
        setError(data.message || "Could not reject invitation");
      }
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-32 items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <h3 className="mb-2 text-lg font-medium">No notifications</h3>
        <p className="text-muted-foreground">You have no call invitations yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-4">Notifications</h1>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {notifications.map((n) => {
          const inviter = n.inviterName || n.inviterEmail || "Someone";
          const call = n.callName || "(no name)";
          const message = `${inviter} (${n.inviterEmail || "-"}) invites u to a call: ${call}`;
          return (
            <Card key={n.id} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="font-semibold">{message}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </CardHeader>
              <CardContent>
                {n.invitationStatus === "pending" && n.invitationId ? (
                  <div className="flex gap-2 mt-2">
                    <Button
                      onClick={() => handleAccept(n.invitationId ?? undefined, n.callId)}
                      disabled={actionLoading === n.invitationId}
                    >
                      Join
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleReject(n.invitationId ?? undefined)}
                      disabled={actionLoading === n.invitationId}
                    >
                     reject
                    </Button>
                  </div>
                ) : n.invitationStatus === "accepted" ? (
                  <span className="text-green-600 font-medium">You've already joined</span>
                ) : n.invitationStatus === "rejected" ? (
                  <span className="text-red-600 font-medium">You've declined the invitation</span>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default NotificationSection;
