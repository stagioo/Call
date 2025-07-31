"use client";
import { useContacts } from "@/components/providers/contacts";
import { useModal } from "@/hooks/use-modal";
import { TEAMS_QUERY } from "@/lib/QUERIES";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@call/ui/components/dialog";
import { Label } from "@call/ui/components/label";
import { Checkbox } from "@call/ui/components/checkbox";
import { Button } from "@call/ui/components/button";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { LoadingButton } from "@call/ui/components/loading-button";

export const AddMemberToTeam = () => {
  const { isOpen, onClose, type, data } = useModal();
  const { contacts, isLoading: contactsLoading } = useContacts();
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  const team = data?.team;

  const isModalOpen = isOpen && type === "add-member-to-team";

  const { mutate: addMembers, isPending: addMembersPending } = useMutation({
    mutationFn: ({
      teamId,
      data,
    }: {
      teamId: string;
      data: { emails: string[] };
    }) => TEAMS_QUERY.addMembers(teamId, data),
    onSuccess: () => {
      toast.success("Members added to team");
      onClose();
      setSelectedContacts([]);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleContactToggle = (email: string) => {
    setSelectedContacts((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const handleAddMembers = () => {
    if (!team || selectedContacts.length === 0) return;

    addMembers({
      teamId: team.id,
      data: { emails: selectedContacts },
    });
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Member to {team?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {contactsLoading ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-muted-foreground">Loading contacts...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {contacts && contacts.length > 0 ? (
                contacts.map((contact) => {
                  if (!contact) return null;
                  const isAlreadyMember = team?.members.some(
                    (member) => member.email === contact.email
                  );
                  const isSelected = selectedContacts.includes(contact.email);

                  return (
                    <div
                      key={contact.email}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={contact.email}
                        checked={isSelected}
                        onCheckedChange={() =>
                          handleContactToggle(contact.email)
                        }
                        disabled={isAlreadyMember}
                      />
                      <Label
                        htmlFor={contact.email}
                        className="flex-1 text-sm font-medium"
                      >
                        {contact.email}
                        {isAlreadyMember && (
                          <span className="text-muted-foreground ml-2 text-xs">
                            (Already a member)
                          </span>
                        )}
                      </Label>
                    </div>
                  );
                })
              ) : (
                <div className="flex h-32 items-center justify-center border">
                  <p className="text-muted-foreground">No contacts found</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <LoadingButton
              onClick={handleAddMembers}
              disabled={addMembersPending || selectedContacts.length === 0}
              loading={addMembersPending}
            >
              Add Members
            </LoadingButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
