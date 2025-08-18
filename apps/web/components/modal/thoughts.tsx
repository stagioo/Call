import { useModal } from "@/hooks/use-modal";
import { THOUGHTS_QUERY } from "@/lib/QUERIES";
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
import { LoadingButton } from "@call/ui/components/loading-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@call/ui/components/select";
import { Textarea } from "@call/ui/components/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const types = [
  { label: "Thoughts", value: "thoughts" },
  { label: "Bug", value: "bug" },
  { label: "Feature", value: "feature" },
  { label: "Improvment", value: "improvment" },
  { label: "Other", value: "other" },
];

const formSchema = z.object({
  type: z.enum(types.map((type) => type.value) as [string, ...string[]]),
  description: z.string().min(1, "Description is required"),
});

export const Thoughts = () => {
  const { isOpen, onClose, type } = useModal();

  const { mutate: createThought, isPending } = useMutation({
    mutationFn: THOUGHTS_QUERY.createThought,
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
      type: "thoughts",
      description: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createThought(data);
  };

  const isModalOpen = isOpen && type === "thoughts";

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-md p-6 bg-[#232323] rounded-2xl" showCloseButton={false}>
        <DialogHeader className="flex flex-col  ">
          <DialogTitle>Thoughts?</DialogTitle>
          <DialogDescription>
            We&apos;re always looking for ways to improve. Let us know what you
            think.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="w-full h-12 !rounded-lg border-1 border-[#434343] bg-[#2F2F2F] text-white">
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                      <SelectContent>
                        {types.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="What can we do better?"
                      className="h-40 resize-none text-base !rounded-lg border-1 border-[#434343] bg-[#2F2F2F] text-white"
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
              Submit
            </LoadingButton>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
