import { useState } from "react";
import { useContacts } from "@/components/providers/contacts";
import { useModal } from "@/hooks/use-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@call/ui/components/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@call/ui/components/form";
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
import { Separator } from "@call/ui/components/separator";

const formSchema = z.object({
  name: z.string().min(1, { message: "Call name is required" }).trim(),
});

export const StartCall = () => {
  const { isOpen, onClose, type } = useModal();
  const router = useRouter();
  const { contacts, isLoading, error } = useContacts();
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  const { mutate: createCall, isPending } = useMutation({
    mutationFn: CALLS_QUERY.createCall,
    onSuccess: (data) => {
      const invitationMessage = selectedContacts.length > 0 
        ? `Invitations sent to ${selectedContacts.length} contact${selectedContacts.length !== 1 ? 's' : ''}. They will receive notifications to join.`
        : "Redirecting to call...";
        
      toast.success("Call created successfully", {
        description: invitationMessage,
      });
      onClose();
      form.reset();
      setSelectedContacts([]);
      router.push(`/app/call/${data.callId}`);
    },
    onError: (error) => {
      toast.error("Failed to create call", {
        description: "Please try again or contact support if the problem persists."
      });
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createCall({
      name: data.name,
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Start Call</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Call Name</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Enter a descriptive name for your call" 
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Separator />
            
            <ContactSelector
              selectedContacts={selectedContacts}
              onContactsChange={setSelectedContacts}
              disabled={isPending}
            />
            
            <div className="flex flex-col gap-3">
              <LoadingButton
                type="submit"
                className="w-full"
                loading={isPending}
                disabled={isPending || !form.formState.isValid}
              >
                {selectedContacts.length > 0 
                  ? `Start Call & Invite ${selectedContacts.length} Contact${selectedContacts.length !== 1 ? 's' : ''}`
                  : "Start Call"
                }
              </LoadingButton>
              
              {selectedContacts.length === 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  You can start the call now and invite contacts later, or select contacts above to send invitations immediately.
                </p>
              )}
              
              {selectedContacts.length > 0 && (
                <p className="text-xs text-green-600 text-center">
                  Invited contacts will receive notifications and can join the call at any time.
                </p>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
