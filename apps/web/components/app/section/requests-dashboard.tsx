"use client"
import { useEffect, useState } from "react";
import { Button } from "@call/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@call/ui/components/card";

interface Request {
  id: string;
  senderId: string;
  receiverEmail: string;
  senderName?: string;
}

export default function RequestsDashboard() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:1284/api/contacts/requests", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch requests");
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err) {
      setError("Could not load requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id: string, action: "accept" | "reject") => {
    setActionLoading(id + action);
    setError(null);
    try {
      const res = await fetch(`http://localhost:1284/api/contacts/requests/${id}/${action}`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Action failed");
      // Remove the request from the list
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError("Could not perform action.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Card className="max-w-xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Pending Contact Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">{error}</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No pending requests.</div>
        ) : (
          <ul className="space-y-4">
            {requests.map((req) => (
              <li key={req.id} className="flex items-center justify-between border-b pb-2">
                <div>
                  <div className="font-medium">
                    {req.senderName || req.senderId}
                  </div>
                  <div className="text-xs text-muted-foreground">{req.receiverEmail}</div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAction(req.id, "accept")}
                    disabled={actionLoading === req.id + "accept"}
                  >
                    {actionLoading === req.id + "accept" ? "Accepting..." : "Accept"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(req.id, "reject")}
                    disabled={actionLoading === req.id + "reject"}
                  >
                    {actionLoading === req.id + "reject" ? "Rejecting..." : "Reject"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
} 