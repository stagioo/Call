import { NextRequest, NextResponse } from "next/server";

// You need to install livekit-server-sdk for this to work:
// pnpm add livekit-server-sdk
import { AccessToken } from "livekit-server-sdk";

// LiveKit credentials (keep these safe in env vars for production!)
const LIVEKIT_API_KEY = "APIsZYZmwhmeLYw";
const LIVEKIT_API_SECRET = "fOIcgwndr96F0m5ekisuaCpXUqpkhop9ZUgdzsA17hg";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const room = searchParams.get("room");
  const username = searchParams.get("username");

  if (!room || !username) {
    return NextResponse.json({ error: "Missing room or username" }, { status: 400 });
  }

  // Create a LiveKit access token
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: username,
  });
  at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true });
  const token = await at.toJwt();

  return NextResponse.json({ token });
} 