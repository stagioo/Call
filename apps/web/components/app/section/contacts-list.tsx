"use client"
import { useEffect, useState } from "react";
import { Card, CardContent } from "@call/ui/components/card";
import { Button } from "@call/ui/components/button";
import { Avatar, AvatarFallback, AvatarImage } from "@call/ui/components/avatar";
import { Badge } from "@call/ui/components/badge";
import { 
  Trash2, 
  User, 
  Mail, 
  Phone, 
  Search,
  Users,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface Contact {
  id: string;
  name?: string;
  email: string;
  image?: string;
}

export default function ContactsList() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingContact, setDeletingContact] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/contacts`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch contacts");
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (err) {
      setError("Could not load contacts.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async (contactId: string, contactEmail: string) => {
    if (!contactId) return;
    
    try {
      setDeletingContact(contactId);
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/contacts/${contactId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete contact");
      }

      setContacts(prev => prev.filter(c => c.id !== contactId));
      toast.success("Contact removed successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete contact");
    } finally {
      setDeletingContact(null);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchContacts();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading contacts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="rounded-full bg-red-50 p-3">
            <User className="h-8 w-8 text-red-500" />
          </div>
          <p className="text-red-500 text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchContacts}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4">
      {/* Search and Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-72"
            />
          </div>
          <Badge variant="outline" className="bg-primary/5 text-primary">
            {contacts.length} contacts
          </Badge>
        </div>
      </div>

      {/* Contacts Grid */}
      {filteredContacts.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-center px-4">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-muted/50 p-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">
              {searchTerm ? "No contacts found" : "No contacts yet"}
            </h3>
            <p className="text-muted-foreground max-w-sm">
              {searchTerm 
                ? "Try adjusting your search terms" 
                : "Start by adding your first contact to stay connected"
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 px-2">
          {filteredContacts.map((contact, idx) => (
            <Card 
              key={(contact.id || contact.email) + '-' + idx} 
              className="group transition-all duration-200 hover:shadow-md overflow-hidden"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12 ring-2 ring-background">
                    <AvatarImage src={contact.image || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5">
                      {contact.name?.charAt(0)?.toUpperCase() || contact.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-base truncate">
                          {contact.name || "No name"}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground truncate">
                            {contact.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDeleteContact(contact.id, contact.email)}
                          disabled={deletingContact === contact.id}
                        >
                          {deletingContact === contact.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 