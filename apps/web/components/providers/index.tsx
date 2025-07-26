import { SocketProvider } from "./socket";
import Modals from "@/components/modal";
import { ContactsProvider } from "./contacts";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SocketProvider>
      <ContactsProvider>
        {children}
        <Modals />
      </ContactsProvider>
    </SocketProvider>
  );
}
