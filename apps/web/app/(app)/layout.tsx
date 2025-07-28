import { auth } from "@call/auth/auth";
import { SessionProvider } from "@/components/providers/session";
import { headers } from "next/headers";
import React from "react";
import { redirect } from "next/navigation";

const AppLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // if (!session) redirect("/login");
  if (!session) return null;
  return <SessionProvider value={session}>{children}</SessionProvider>;
};

export default AppLayout;
