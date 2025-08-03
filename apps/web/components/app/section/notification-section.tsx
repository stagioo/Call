"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@call/ui/components/card";
import { Button } from "@call/ui/components/button";
import { Badge } from "@call/ui/components/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@call/ui/components/avatar";
import { 
  Bell, 
  Phone, 
  Users, 
  UserPlus, 
  CheckCircle, 
  XCircle, 
  Clock,
  Video,
  Calendar
} from "lucide-react";

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

// Tab labels for notification sections
const TABS = [
  { key: "all", label: "All notifications", icon: Bell },
  { key: "calls", label: "Calls", icon: Phone },
  { key: "schedules", label: "Schedules", icon: Calendar },
  { key: "teams", label: "Teams", icon: Users },
  { key: "contacts", label: "Contacts", icon: UserPlus },
];

const NotificationSection = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all"); // Track selected tab
  const router = useRouter();

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch both call notifications and contact requests
        const [notificationsRes, contactRequestsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/notifications`, {
            credentials: "include",
          }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/contacts/requests`, {
            credentials: "include",
          }),
        ]);

        if (!notificationsRes.ok)
          throw new Error("Failed to load notifications");
        if (!contactRequestsRes.ok)
          throw new Error("Failed to load contact requests");

        const [notificationsData, contactRequestsData] = await Promise.all([
          notificationsRes.json(),
          contactRequestsRes.json(),
        ]);

        // Transform contact requests into notifications format
        const contactNotifications = (contactRequestsData.requests || []).map(
          (req: any) => ({
            id: req.id,
            type: "contact",
            message: `${req.senderName || req.senderEmail} wants to connect with you`,
            callId: null,
            contactRequestId: req.id,
            contactRequestStatus: "pending",
            senderName: req.senderName,
            senderEmail: req.senderEmail,
            createdAt: new Date().toISOString(), // Since we don't have the actual creation date
          })
        );

        // Combine both types of notifications
        setNotifications([
          ...contactNotifications,
          ...(notificationsData.notifications || []).map((n: any) => ({
            ...n,
            type: "call",
          })),
        ]);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleAccept = async (
    invitationId?: string,
    callId?: string | null
  ) => {
    if (!invitationId || !callId) return;
    setActionLoading(invitationId);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/calls/invitations/${invitationId}/accept`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );
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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/calls/invitations/${invitationId}/reject`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );
      if (res.ok) {
        setNotifications((prev) =>
          prev.filter((n) => n.invitationId !== invitationId)
        );
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

  const handleContactAction = async (
    requestId: string,
    action: "accept" | "reject"
  ) => {
    if (!requestId) return;
    setActionLoading(requestId);
    try {
      const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/contacts/requests/${requestId}/${action}`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );
      if (res.ok) {
        setNotifications((prev) =>
          prev.filter((n) => n.contactRequestId !== requestId)
        );
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.split('@')[0]?.slice(0, 2)?.toUpperCase() || 'U';
  };

  const getNotificationType = (notification: Notification) => {
    if (notification.type === "contact") return "contact";
    if (notification.message?.includes("team")) return "team";
    return "call";
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <XCircle className="h-8 w-8 text-red-500" />
          <p className="text-red-500 text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Tab bar UI
  const renderTabs = () => (
    <div className="flex gap-1 mb-8 p-1 bg-muted/30 rounded-lg">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
              activeTab === tab.key
                ? "bg-background text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
            onClick={() => setActiveTab(tab.key)}
            type="button"
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  const renderNotificationCard = (n: Notification) => {
    const notificationType = getNotificationType(n);
    const isContact = n.type === "contact";
    const senderName = isContact ? n.senderName : n.inviterName;
    const senderEmail = isContact ? n.senderEmail : n.inviterEmail;
    const displayName = senderName || senderEmail || "Unknown User";

    const typeIcons = {
      call: <Video className="h-4 w-4 text-muted-foreground" />,
      team: <Users className="h-4 w-4 text-muted-foreground" />,
      contact: <UserPlus className="h-4 w-4 text-muted-foreground" />
    };

    const typeBadges = {
      call: <Badge variant="outline" className="text-xs">Call</Badge>,
      team: <Badge variant="outline" className="text-xs">Team</Badge>,
      contact: <Badge variant="outline" className="text-xs">Contact</Badge>
    };

    return (
      <Card key={n.id} className="transition-all duration-200 hover:shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" />
              <AvatarFallback className="text-xs font-medium bg-muted">
                {getInitials(displayName, senderEmail || "")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {typeIcons[notificationType]}
                <span className="font-medium text-sm">{displayName}</span>
                {typeBadges[notificationType]}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {n.message}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(n.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isContact ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleContactAction(n.contactRequestId!, "accept")}
                disabled={actionLoading === n.contactRequestId}
                className="flex-1"
              >
                {actionLoading === n.contactRequestId ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  "Accept"
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleContactAction(n.contactRequestId!, "reject")}
                disabled={actionLoading === n.contactRequestId}
                className="flex-1"
              >
                {actionLoading === n.contactRequestId ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                ) : (
                  "Decline"
                )}
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              {n.invitationStatus === "pending" && n.invitationId ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleAccept(n.invitationId ?? undefined, n.callId)}
                    disabled={actionLoading === n.invitationId}
                    className="flex-1"
                  >
                    {actionLoading === n.invitationId ? (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      "Join Call"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(n.invitationId ?? undefined)}
                    disabled={actionLoading === n.invitationId}
                    className="flex-1"
                  >
                    {actionLoading === n.invitationId ? (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    ) : (
                      "Decline"
                    )}
                  </Button>
                </>
              ) : n.invitationStatus === "accepted" ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Accepted</span>
                </div>
              ) : n.invitationStatus === "rejected" ? (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm">Declined</span>
                </div>
              ) : n.callId ? (
                <Button
                  size="sm"
                  onClick={() => router.push(`/app/call/${n.callId}`)}
                  className="flex-1"
                >
                  Join Meeting
                </Button>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Only show notifications in 'All notifications' tab for now
  const renderContent = () => {
    if (activeTab === "calls") {
      // Show only call invitation notifications that are NOT team meetings
      const callInvites = notifications.filter(
        (n) => n.type === "call" && n.invitationId && !(typeof n.message === "string" && n.message.includes("started a meeting in team"))
      );
      if (callInvites.length === 0) {
        return (
          <div className="flex h-48 items-center justify-center text-center">
            <div className="flex flex-col items-center gap-3">
              <Phone className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">No call invitations.</p>
            </div>
          </div>
        );
      }
      return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {callInvites.map(renderNotificationCard)}
        </div>
      );
    }
    if (activeTab === "teams") {
      // Show only team call notifications
      const teamCallNotifications = notifications.filter(
        (n) => n.type === "call" && typeof n.message === "string" && n.message.includes("started a meeting in team")
      );
      if (teamCallNotifications.length === 0) {
        return (
          <div className="flex h-48 items-center justify-center text-center">
            <div className="flex flex-col items-center gap-3">
              <Users className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">No team call notifications.</p>
            </div>
          </div>
        );
      }
      return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teamCallNotifications.map(renderNotificationCard)}
        </div>
      );
    }
    if (activeTab === "contacts") {
      // Show only contact invitation notifications
      const contactInvites = notifications.filter(
        (n) => n.type === "contact"
      );
      if (contactInvites.length === 0) {
        return (
          <div className="flex h-48 items-center justify-center text-center">
            <div className="flex flex-col items-center gap-3">
              <UserPlus className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">No contact invitations.</p>
            </div>
          </div>
        );
      }
      return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {contactInvites.map(renderNotificationCard)}
        </div>
      );
    }
    if (activeTab !== "all") {
      // Placeholder for future content
      return (
        <div className="flex h-48 items-center justify-center text-center">
          <div className="flex flex-col items-center gap-3">
            <Calendar className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No notifications in this section yet.</p>
          </div>
        </div>
      );
    }
    if (notifications.length === 0) {
      return (
        <div className="flex h-64 flex-col items-center justify-center text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-muted/50 p-4">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No notifications</h3>
            <p className="text-muted-foreground max-w-sm">You have no notifications yet.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {notifications.map(renderNotificationCard)}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {notifications.length} total notifications
          </p>
        </div>
      </div>
      {renderTabs()}
      {renderContent()}
    </div>
  );
};

export default NotificationSection;
