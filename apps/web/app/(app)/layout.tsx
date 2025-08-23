import React from "react";
import { ContactsProvider } from "@/components/providers/contacts";
import SocketConnectionIndicator from "@/components/socket-connection-indicator";

const AppLayout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <ContactsProvider>
      {children}
      <SocketConnectionIndicator />
    </ContactsProvider>
  );
};

export default AppLayout;
