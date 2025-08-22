import Modals from "@/components/modal";
import React from "react";
import SocketConnectionIndicator from "../socket-connection-indicator";
import { ContactsProvider } from "./contacts";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <React.Fragment>
      <ContactsProvider>
        {children}
        <Modals />
      </ContactsProvider>
      <SocketConnectionIndicator />
    </React.Fragment>
  );
}
