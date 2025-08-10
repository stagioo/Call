import { useState } from "react";
import { useContacts } from "@/components/providers/contacts";
import { Avatar } from "@call/ui/components/avatar";
import { Checkbox } from "@call/ui/components/checkbox";
import { Search } from "lucide-react";
import { Input } from "@call/ui/components/input";

interface Contact {
  id: string;
  name: string;
  email: string;
}

interface ContactSelectorProps {
  selectedContacts: string[];
  onContactsChange: (emails: string[]) => void;
  disabled?: boolean;
}

export function ContactSelector({
  selectedContacts,
  onContactsChange,
  disabled = false,
}: ContactSelectorProps) {
  const { contacts, isLoading, error } = useContacts();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleContactToggle = (email: string, checked: boolean) => {
    if (disabled) return;

    if (checked) {
      onContactsChange([...selectedContacts, email]);
    } else {
      onContactsChange(selectedContacts.filter((e) => e !== email));
    }
  };

  if (isLoading) {
    return (
      <div className="text-muted-foreground py-4 text-center text-sm">
        Loading contacts...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-center text-sm text-red-500">
        Error loading contacts
      </div>
    );
  }

  if (contacts.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-12 pl-10"
          disabled={disabled}
        />
      </div>

      <div className="max-h-[240px] space-y-1 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="text-muted-foreground py-4 text-center text-sm">
            No contacts found
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="hover:bg-muted/50 flex items-center gap-3 rounded-lg p-3 transition-colors"
            >
              <Checkbox
                id={contact.id}
                checked={selectedContacts.includes(contact.email)}
                onCheckedChange={(checked) =>
                  handleContactToggle(contact.email, checked as boolean)
                }
                disabled={disabled}
              />
              <Avatar className="h-8 w-8">
                <div
                  key={`avatar-${contact.id}`}
                  className="bg-primary/10 text-primary flex h-full w-full items-center justify-center rounded-full text-sm font-medium"
                >
                  {contact.name.charAt(0).toUpperCase()}
                </div>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{contact.name}</div>
                <div className="text-muted-foreground truncate text-xs">
                  {contact.email}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
