"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@call/ui/components/card";
import { useParams } from "next/navigation";

export default function CallRoomPage() {
  const params = useParams();
  const callId = params?.id;
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Call Room</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground mb-2">Call ID: {callId}</div>
          <div className="text-lg">You have created a call. Share the link to invite others.</div>
        </CardContent>
      </Card>
    </div>
  );
} 