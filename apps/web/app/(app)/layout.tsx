import { SessionProvider } from "@/components/providers/session";
import { auth, type Session } from "@call/auth/auth";
import { headers } from "next/headers";
import React from "react";

const AppLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    const now = new Date();
    const guestSession: Session = {
      user: {
        id: "guest",
        name: "Guest",
        email: "guest@anonymous",
        emailVerified: false,
        image: null,
        createdAt: now,
        updatedAt: now,
      },
      session: {
        id: "guest-session",
        expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7),
        token: "",
        createdAt: now,
        updatedAt: now,
        ipAddress: null,
        userAgent: null,
        userId: "guest",
      },
    } as unknown as Session;

    return <SessionProvider value={guestSession}>{children}</SessionProvider>;
  }

  return <SessionProvider value={session}>{children}</SessionProvider>;
};

export default AppLayout;