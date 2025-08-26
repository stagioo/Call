import React from "react";
import { ContactsProvider } from "@/components/providers/contacts";
import SocketConnectionIndicator from "@/components/socket-connection-indicator";
import { auth } from "@call/auth/auth";
import { headers } from "next/headers";
import { SessionProvider } from "@/components/providers/session";
import { redirect } from "next/navigation";
import { Providers } from "@/components/providers";
import { CallProvider } from "@/contexts/call-context";
import { SocketProvider } from "@/components/providers/socket";
import { ThemeAndQueryProviders } from "@/components/providers/theme-and-query";

const AppLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");

  return (
    <SocketProvider>
      <ThemeAndQueryProviders>
        <SessionProvider value={session || undefined}>
          <Providers>
            <CallProvider>
              <ContactsProvider>
                {children}
                <SocketConnectionIndicator />
              </ContactsProvider>
            </CallProvider>
          </Providers>
        </SessionProvider>
      </ThemeAndQueryProviders>
    </SocketProvider>
  );
};

export default AppLayout;
