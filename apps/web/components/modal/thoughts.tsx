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
  FormMessage,
} from "@call/ui/components/form";
import { LoadingButton } from "@call/ui/components/loading-button";
import { Textarea } from "@call/ui/components/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).trim(),
});

export const Thoughts = () => {
  const { isOpen, onClose, type } = useModal();

  const { mutate: createContact, isPending } = useMutation({
    mutationFn: () => {
      return Promise.resolve();
    },
    onSuccess: (data) => {
      toast.success("Thanks for your feedback!");
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast.error("Failed to submit feedback", {
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
    createContact();

    // TODO: Send feedback to backend so it can forward it to discord private channel
  };

  const isModalOpen = isOpen && type === "thoughts";

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thoughts?</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="What can we do better?"
                      className="h-40 resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <LoadingButton
              type="submit"
              className="w-full"
              loading={isPending}
              disabled={isPending || !form.formState.isValid}
            >
              Submit
            </LoadingButton>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
