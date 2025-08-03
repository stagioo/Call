import ContactsList from "./contacts-list";
import { UserPlus } from "lucide-react";

export const ContactSection = ({ onAddContact }: { onAddContact?: () => void }) => {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Contacts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your contacts and connections
          </p>
        </div>
        {onAddContact && (
          <button
            className="inline-flex items-center gap-2 bg-primary text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
            onClick={onAddContact}
          >
            <UserPlus className="h-4 w-4" />
            Add Contact
          </button>
        )}
      </div>
      <ContactsList />
    </div>
  );
};

export default ContactSection;
