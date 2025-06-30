"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
// LiveKit imports
import { LiveKitRoom } from "livekit-react";
// import { LiveKitRoom } from "@livekit/react-components"; // Use this if you upgrade to the new package

// LiveKit Cloud URL
const LIVEKIT_URL = "wss://call-z0ozwesk.livekit.cloud";

export default function RoomPage() {
  const params = useParams();
  // Robustly extract id from params (handle string or array)
  const id = useMemo(() => {
    if (!params) return undefined;
    if (typeof params === "object" && "id" in params) {
      const value = (params as any).id;
      if (typeof value === "string") return value;
      if (Array.isArray(value)) return value[0];
    }
    return undefined;
  }, [params]);

  // Debug logs for params and id
  useEffect(() => {
    console.log("[LiveKit Debug] useParams() result:", params);
    console.log("[LiveKit Debug] Extracted id:", id);
  }, [params, id]);

  const [token, setToken] = useState<string>("");
  const [tokenError, setTokenError] = useState<string>("");

  // For demo: use a random name
  const userName = useMemo(() => `user-${Math.floor(Math.random() * 10000)}`,[id]);

  useEffect(() => {
    if (!id) return;
    setToken("");
    setTokenError("");
    fetch(`/api/livekit-token?room=${id}&username=${userName}`)
      .then(res => {
        if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (typeof data.token === "string") {
          setToken(data.token);
        } else {
          setTokenError("No token received from API");
        }
      })
      .catch((err) => {
        setTokenError(err.message || "Unknown error fetching token");
      });
  }, [id, userName]);

  // Debug log for token and errors
  useEffect(() => {
    if (token) console.log("[LiveKit Debug] Got token:", token);
    if (tokenError) console.error("[LiveKit Debug] Token error:", tokenError);
  }, [token, tokenError]);

  if (!id) return <div className="text-white">Invalid room link (no id param)</div>;
  if (tokenError) return <div className="text-red-500">Token error: {tokenError}</div>;
  if (!token) return <div className="text-white">Loading...</div>;

  return (
    <div className="w-screen min-h-screen bg-[#101010] flex items-center justify-center">
      {/* LiveKitRoom provides the full video call UI out of the box */}
      <LiveKitRoom
        url={LIVEKIT_URL}
        token={token}
        // connect={true} // Removed: not a valid prop
        // You can customize the UI or use your own components here
      />
      {/*
        To customize the UI, see LiveKit docs:
        https://docs.livekit.io/client-sdk/react/
      */}
    </div>
  );
} 