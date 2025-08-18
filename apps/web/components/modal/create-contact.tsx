import { useContacts } from "@/components/providers/contacts";
import { useModal } from "@/hooks/use-modal";
import { CONTACTS_QUERY } from "@/lib/QUERIES";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@call/ui/components/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@call/ui/components/form";
import { Input } from "@call/ui/components/input";
import { LoadingButton } from "@call/ui/components/loading-button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).trim(),
});

export const CreateContact = () => {
  const { isOpen, onClose, type } = useModal();
  const router = useRouter();
  const { contacts, isLoading, error } = useContacts();

  const { mutate: createContact, isPending } = useMutation({
    mutationFn: CONTACTS_QUERY.createContact,
    onSuccess: (data) => {
      toast.success(data.message || "Contact created successfully");
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast.error("Failed to create contact", {
        description: error.response?.data.message || "Unknown error",
      });
    },
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createContact({
      email: data.email,
    });
  };

  const isModalOpen = isOpen && type === "create-contact";

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-sm p-6 bg-[#232323] rounded-2xl" showCloseButton={false}>
        <DialogHeader className="flex flex-col  ">
          <DialogTitle>Create Contact</DialogTitle>
          <DialogDescription>
            Add a new contact to your contacts list.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="hello@joincall.co"
                      className="h-12 text-2xl !rounded-lg border-1 border-[#434343] bg-[#2F2F2F] text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <LoadingButton
              type="submit"
              className="h-10 w-full rounded-lg text-sm font-medium bg-primary-blue hover:bg-primary-blue/80 text-white "
              loading={isPending}
              disabled={isPending || !form.formState.isValid}
            >
              Create Contact
            </LoadingButton>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
