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
  type?: "call" | "contact";
  contactRequestId?: string;
  contactRequestStatus?: "pending" | "accepted" | "rejected";
  senderName?: string;
  senderEmail?: string;
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
        // Fetch both call notifications and contact requests
        const [notificationsRes, contactRequestsRes] = await Promise.all([
          fetch("http://localhost:1284/api/notifications", { credentials: "include" }),
          fetch("http://localhost:1284/api/contacts/requests", { credentials: "include" })
        ]);

        if (!notificationsRes.ok) throw new Error("Failed to load notifications");
        if (!contactRequestsRes.ok) throw new Error("Failed to load contact requests");

        const [notificationsData, contactRequestsData] = await Promise.all([
          notificationsRes.json(),
          contactRequestsRes.json()
        ]);

        // Transform contact requests into notifications format
        const contactNotifications = (contactRequestsData.requests || []).map((req: any) => ({
          id: req.id,
          type: "contact",
          message: `${req.senderName || req.senderEmail} wants to connect with you`,
          callId: null,
          contactRequestId: req.id,
          contactRequestStatus: "pending",
          senderName: req.senderName,
          senderEmail: req.senderEmail,
          createdAt: new Date().toISOString() // Since we don't have the actual creation date
        }));

        // Combine both types of notifications
        setNotifications([
          ...contactNotifications,
          ...(notificationsData.notifications || []).map((n: any) => ({ ...n, type: "call" }))
        ]);
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
        router.push(`/app/call/${data.callId}`);
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

  const handleContactAction = async (requestId: string, action: "accept" | "reject") => {
    if (!requestId) return;
    setActionLoading(requestId);
    try {
      const res = await fetch(`http://localhost:1284/api/contacts/requests/${requestId}/${action}`, {
        method: "PATCH",
        credentials: "include",
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.contactRequestId !== requestId));
      } else {
        const data = await res.json();
        setError(data.message || `Could not ${action} contact request`);
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
        <p className="text-muted-foreground">You have no notifications yet.</p>
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
          if (n.type === "contact") {
            return (
              <Card key={n.id} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="font-semibold">{n.message}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mt-2">
                    <Button
                      onClick={() => handleContactAction(n.contactRequestId!, "accept")}
                      disabled={actionLoading === n.contactRequestId}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleContactAction(n.contactRequestId!, "reject")}
                      disabled={actionLoading === n.contactRequestId}
                    >
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          }

          // Call notifications
          const inviter = n.inviterName || n.inviterEmail || "Someone";
          const call = n.callName || "(no name)";
          const message = n.message || `${inviter} (${n.inviterEmail || "-"}) invites you to a call: ${call}`;
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
                      Reject
                    </Button>
                  </div>
                ) : n.invitationStatus === "accepted" ? (
                  <span className="text-green-600 font-medium">You've already joined</span>
                ) : n.invitationStatus === "rejected" ? (
                  <span className="text-red-600 font-medium">You've declined the invitation</span>
                ) : n.callId ? (
                  <div className="flex gap-2 mt-2">
                    <Button
                      onClick={() => router.push(`/app/call/${n.callId}`)}
                    >
                      Join Meeting
                    </Button>
                  </div>
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
