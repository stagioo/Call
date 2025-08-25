import React from "react";
import { ContactsProvider } from "@/components/providers/contacts";
import SocketConnectionIndicator from "@/components/socket-connection-indicator";
import { auth } from "@call/auth/auth";
import { headers } from "next/headers";
import { SessionProvider } from "@/components/providers/session";
import { redirect } from "next/navigation";

const AppLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");

  return (
    <SessionProvider value={session || undefined}>
      <ContactsProvider>
        {children}
        <SocketConnectionIndicator />
      </ContactsProvider>
    </SessionProvider>
  );
};

export default AppLayout;
