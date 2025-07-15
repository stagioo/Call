"use client"
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@call/ui/components/card";

interface Contact {
  id: string;
  name?: string;
  email: string;
}

export default function ContactsList() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:1284/api/contacts", {
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
                className="flex items-center gap-4 border-b pb-2"
              >
                <div>
                  <div className="font-medium">{contact.name || contact.email}</div>
                  <div className="text-xs text-muted-foreground">{contact.email}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
} 