import { SessionProvider } from "@/components/providers/session";
import { auth } from "@call/auth/auth";
import { headers } from "next/headers";
import React from "react";

const AppLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session)
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div>You are not logged in</div>
      </div>
    );
  return <SessionProvider value={session}>{children}</SessionProvider>;
};

export default AppLayout;
