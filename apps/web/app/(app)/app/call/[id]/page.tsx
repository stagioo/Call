"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";

export default function CallRoomPage() {
  const params = useParams();
  const router = useRouter();
  const callId = params?.id;
  const { session, isLoading } = useSession();

  useEffect(() => {
    if (!isLoading && !session?.user) {
      router.replace("/login");
    }
  }, [isLoading, session, router]);

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!session?.user) {
    // Redirección en curso
    return null;
  }

  return (
    <div>
      <h1>Call Room</h1>
      <p>Call ID: {callId}</p>
    </div>
  );
} 