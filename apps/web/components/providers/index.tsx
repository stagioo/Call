import { SocketProvider } from "./socket";
import Modals from "@/components/modal";
import { ContactsProvider } from "./contacts";
import SocketConnectionIndicator from "../socket-connection-indicator";
import { CallProvider } from "@/contexts/call-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SocketProvider>
      <CallProvider>
        <ContactsProvider>
          {children}
          <Modals />
        </ContactsProvider>
        <SocketConnectionIndicator />
      </CallProvider>
    </SocketProvider>
  );
}
