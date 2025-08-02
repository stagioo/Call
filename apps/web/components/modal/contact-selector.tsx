import { useState, useEffect } from "react";
import { useContacts } from "@/components/providers/contacts";
import { Avatar } from "@call/ui/components/avatar";
import { Checkbox } from "@call/ui/components/checkbox";
import { Badge } from "@call/ui/components/badge";
import { Search } from "lucide-react";
import { Input } from "@call/ui/components/input";
import { Label } from "@call/ui/components/label";

interface Contact {
  contactId: string;
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
  disabled = false 
}: ContactSelectorProps) {
  const { contacts, isLoading, error } = useContacts();
  const [searchTerm, setSearchTerm] = useState("");

  // Filter contacts based on search term
  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleContactToggle = (email: string, checked: boolean) => {
    if (disabled) return;
    
    if (checked) {
      onContactsChange([...selectedContacts, email]);
    } else {
      onContactsChange(selectedContacts.filter(e => e !== email));
    }
  };

  const handleSelectAll = () => {
    if (disabled) return;
    
    if (selectedContacts.length === filteredContacts.length) {
      // Deselect all
      onContactsChange([]);
    } else {
      // Select all filtered contacts
      onContactsChange(filteredContacts.map(c => c.email));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Label>Invite Contacts</Label>
        <div className="text-sm text-muted-foreground">Loading contacts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <Label>Invite Contacts</Label>
        <div className="text-sm text-red-500">Error loading contacts</div>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="space-y-3">
        <Label>Invite Contacts</Label>
        <div className="text-center py-6 px-4 border rounded-md bg-muted/20">
          <div className="text-sm text-muted-foreground mb-3">
            No contacts available to invite
          </div>
          <div className="text-xs text-muted-foreground">
            Add contacts from the Contacts section to invite them to calls. 
            You can still start the call without inviting anyone.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Invite Contacts</Label>
        {selectedContacts.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {selectedContacts.length} selected
          </Badge>
        )}
      </div>
      
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          disabled={disabled}
        />
      </div>

      {/* Select all button */}
      {filteredContacts.length > 0 && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="select-all"
            checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
            onCheckedChange={handleSelectAll}
            disabled={disabled}
          />
          <Label 
            htmlFor="select-all" 
            className="text-sm font-normal cursor-pointer"
          >
            Select all ({filteredContacts.length})
          </Label>
        </div>
      )}

      {/* Contacts list */}
      <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-3">
        {filteredContacts.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No contacts found matching "{searchTerm}"
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.contactId}
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={contact.contactId}
                checked={selectedContacts.includes(contact.email)}
                onCheckedChange={(checked) => 
                  handleContactToggle(contact.email, checked as boolean)
                }
                disabled={disabled}
              />
              <Avatar className="h-8 w-8">
                <div className="h-full w-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
              </Avatar>
              <div className="flex-1 min-w-0">
                <Label 
                  htmlFor={contact.contactId}
                  className="font-medium cursor-pointer block truncate"
                >
                  {contact.name}
                </Label>
                <div className="text-xs text-muted-foreground truncate">
                  {contact.email}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedContacts.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Selected contacts will receive a notification to join the call
        </div>
      )}
    </div>
  );
} 