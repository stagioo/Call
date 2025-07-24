import { useEffect, useState } from "react";
import { Card, CardHeader } from "@call/ui/components/card";
import { formatDistanceToNow } from "date-fns";
// import { es } from "date-fns/locale";

interface Call {
  id: string;
  name: string;
  joinedAt: string;
}

export function CallHistory() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const res = await fetch("http://localhost:1284/api/calls/participated", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch calls");
        const data = await res.json();
        setCalls(data.calls);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading calls");
      } finally {
        setLoading(false);
      }
    };

    fetchCalls();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-12 bg-muted"></CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <p>Error: {error}</p>
        <p className="mt-2">Please try again later</p>
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No call history yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {calls.map((call) => (
        <Card key={call.id}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{call.name}</h3>
              <time className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(call.joinedAt), { 
                  addSuffix: true,
                  // locale: es 
                })}
              </time>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
} 