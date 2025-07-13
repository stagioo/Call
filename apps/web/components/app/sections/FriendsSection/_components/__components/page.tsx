import { Input } from "@call/ui/components/input";
import { Button } from "@call/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@call/ui/components/card";
import { useState } from "react";
import type { SendInvitationContactsProps } from "@/lib/types";

export const SendInvitationContacts = ({ open, onClose }: SendInvitationContactsProps) => {
  const [email, setEmail] = useState("");


 

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative w-full max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Invite a friend</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input
              placeholder="Enter email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
          
            />
            <Button
              className="w-full bg-[#272727] text-sm text-[#fff] hover:bg-[#272727]"
           
            >
              Send invitation
            </Button>
            <Button
              variant="ghost"
              className="w-full mt-2"
              onClick={onClose}
             
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};