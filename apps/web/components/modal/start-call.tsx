import { useState } from "react";
import { useContacts } from "@/components/providers/contacts";
import { useModal } from "@/hooks/use-modal";
import {
  Dialog,
  DialogContent,
} from "@call/ui/components/dialog";
import { Input } from "@call/ui/components/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { CALLS_QUERY } from "@/lib/QUERIES";
import { LoadingButton } from "@call/ui/components/loading-button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ContactSelector } from "./contact-selector";
import { useSession } from "@/components/providers/session";

const formSchema = z.object({
  name: z.string().trim(),
});

export const StartCall = () => {
  const { isOpen, onClose, type } = useModal();
  const router = useRouter();
  const { contacts, isLoading, error } = useContacts();
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const { user } = useSession();

  const { mutate: createCall, isPending } = useMutation({
    mutationFn: CALLS_QUERY.createCall,
    onSuccess: (data) => {
      if (selectedContacts.length > 0) {
        toast.success(`Invitations sent to ${selectedContacts.length} contact${selectedContacts.length !== 1 ? "s" : ""}`);
      }
      onClose();
      form.reset();
      setSelectedContacts([]);
      router.push(`/app/call/${data.callId}`);
    },
    onError: () => {
      toast.error("Failed to create call");
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const userName = user?.name || "User";
    createCall({
      name: data.name && data.name.trim() !== "" ? data.name : `${userName}-call`,
      members: selectedContacts,
    });
  };

  const isModalOpen = isOpen && type === "start-call";

  const handleModalClose = () => {
    if (!isPending) {
      onClose();
      form.reset();
      setSelectedContacts([]);
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-md p-6 space-y-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Input
            {...form.register("name")}
            placeholder="Call name (optional)"
            className="h-12 text-lg"
            disabled={isPending}
          />

          <ContactSelector
            selectedContacts={selectedContacts}
            onContactsChange={setSelectedContacts}
            disabled={isPending}
          />

          <LoadingButton
            type="submit"
            className="w-full h-12 text-lg font-medium"
            loading={isPending}
            disabled={isPending}
          >
            {selectedContacts.length > 0
              ? `Start with ${selectedContacts.length} contact${selectedContacts.length !== 1 ? "s" : ""}`
              : "Start call"}
          </LoadingButton>
        </form>
      </DialogContent>
    </Dialog>
  );
};
