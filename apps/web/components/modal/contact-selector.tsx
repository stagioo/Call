import { useContacts } from "@/components/providers/contacts";
import { Checkbox } from "@call/ui/components/checkbox";
import { Input } from "@call/ui/components/input";
import { UserProfile } from "@call/ui/components/use-profile";
import { Search } from "lucide-react";
import { useState } from "react";
import { cn } from "@call/ui/lib/utils";

interface ContactSelectorProps {
  selectedContacts: string[];
  onContactsChange: (emails: string[]) => void;
  disabled?: boolean;
  disabledEmails?: string[];
}

export function ContactSelector({
  selectedContacts,
  onContactsChange,
  disabled = false,
  disabledEmails = [],
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
          className="h-12 text-2xl !rounded-lg border-1 border-[#434343] bg-[#2F2F2F] text-white pl-10"
          disabled={disabled}
        />
      </div>

      <div className="max-h-[240px] space-y-1 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="text-muted-foreground py-4 text-center text-sm">
            No contacts found
          </div>
        ) : (
          filteredContacts.map((contact) => {
            const isChecked = selectedContacts.includes(contact.email);
            const isDisabled = disabled || disabledEmails.includes(contact.email);
            return (
              <div
                key={contact.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50",
                  isChecked && "bg-[#3B3B3B]"
                )}
              >
                <Checkbox
                  id={contact.id}
                  checked={isChecked}
                  className="border-inset-accent border-1 border-[#636363] bg-[#4B4B4B] rounded-sm"
                  onCheckedChange={(checked) =>
                    handleContactToggle(contact.email, checked as boolean)
                  }
                  disabled={isDisabled}
                />
                <UserProfile
                  name={contact.name}
                  url={contact.image}
                  size="sm"
                  className="rounded-lg text-md"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{contact.name}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
