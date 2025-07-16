"use client";

import { Card, CardContent, CardFooter } from "@call/ui/components/card";

import { Input } from "@call/ui/components/input";
import { Button } from "@call/ui/components/button";
import { Label } from "@call/ui/components/label";
import { useSession } from "@/hooks/useSession";
import { useState } from "react";

export function ModalContact({ onClose }: { onClose?: () => void }) {
  const { session } = useSession();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.includes("@")) {
      setError("Add a valid email");
      return;
    }
    if (!session?.session?.token) {
      setError("sign in to send invi");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:1284/api/contacts/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${session.session.token}`,
        },
        credentials: "include",
        body: JSON.stringify({ receiverEmail: email })
        
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || "error to send invi/req");
      } else {
        setSuccess(true);
        setTimeout(() => {
          onClose?.();
        }, 1200);
      }
    } catch (err) {
      setError("net issue, try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full w-lg">
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading || success}
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            {success && <div className="text-green-600 text-sm">sent!! 🎉</div>}
          </div>
          <CardFooter className="flex-col gap-2 mt-6">
            <Button type="submit" className="w-full" disabled={loading || success}>
              {loading ? "sending..." : success ? "sent" : "send"}
            </Button>
            <Button variant="outline" className="w-full" onClick={onClose} type="button" disabled={loading}>
              Close
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
