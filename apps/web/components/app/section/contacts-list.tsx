"use client"
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@call/ui/components/card";
import { Button } from "@call/ui/components/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Contact {
  id: string;
  name?: string;
  email: string;
}

export default function ContactsList() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingContact, setDeletingContact] = useState<string | null>(null);

  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.BACKEND_URL}/api/contacts`, {
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
      const res = await fetch(`${process.env.BACKEND_URL}/api/contacts/${contactId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete contact");
      }

      // Remove the contact from the local state
      setContacts(prev => prev.filter(c => c.id !== contactId));
      toast.success("Contact removed successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete contact");
    } finally {
      setDeletingContact(null);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  return (
    <Card className="max-w-xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Your Contacts</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">{error}</div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">You have no contacts.</div>
        ) : (
          <ul className="space-y-4">
            {contacts.map((contact, idx) => (
              <li
                key={(contact.id || contact.email) + '-' + idx}
                className="flex items-center justify-between gap-4 border-b pb-2"
              >
                <div>
                  <div className="font-medium">{contact.name || contact.email}</div>
                  <div className="text-xs text-muted-foreground">{contact.email}</div>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDeleteContact(contact.id, contact.email)}
                  disabled={deletingContact === contact.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
} 