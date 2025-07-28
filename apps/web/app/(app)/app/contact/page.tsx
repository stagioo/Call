"use client";

import ContactsList from "@/components/app/section/contacts-list";
import Header from "@/components/app/header";
import { Button } from "@call/ui/components/button";
import { useModal } from "@/hooks/use-modal";

export default function ContactPage() {
  const { onOpen } = useModal();
  return (
    <div className="flex flex-col gap-[22px]">
      <Header className="justify-between">
        <div></div>
        <Button
          onClick={() => onOpen("create-contact")}
          className="bg-inset-accent-foreground hover:bg-inset-accent-foreground/80 text-white"
        >
          Create Contact
        </Button>
      </Header>
      <ContactsList />
    </div>
  );
}
