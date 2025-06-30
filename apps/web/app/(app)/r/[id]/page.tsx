"use client";

import { useEffect, useState } from "react";
import { VideoConference, RoomContext } from "@livekit/components-react";
import { Room } from "livekit-client";
import { useParams } from "next/navigation";

const LIVEKIT_URL = "wss://call-z0ozwesk.livekit.cloud";

function randomName() {
  return "user-" + Math.random().toString(36).substring(2, 10);
}

async function fetchToken(roomName: string, participantName: string) {
  const resp = await fetch(`/api/livekit-token?room=${roomName}&username=${participantName}`);
  const data = await resp.json();
  return data.token;
}

export default function RoomPage() {
  const params = useParams();
  const roomName = params?.id as string;
  const [room, setRoom] = useState<Room | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [username] = useState(() => randomName());

  useEffect(() => {
    if (roomName && !token) {
      fetchToken(roomName, username).then(setToken);
    }
  }, [roomName, token, username]);

  useEffect(() => {
    if (token && !room) {
      const r = new Room();
      r.connect(LIVEKIT_URL, token).then(() => {
        setRoom(r);
        r.localParticipant.enableCameraAndMicrophone().catch(() => {});
      });
    }
    // Cleanup
    return () => {
      if (room) {
        room.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, room]);

  if (!token || !room) {
    return <div className="min-h-screen flex items-center justify-center">Conectando...</div>;
  }

  return (
    <div className="min-h-screen">
      <RoomContext.Provider value={room}>
        <VideoConference />
      </RoomContext.Provider>
    </div>
  );
}
