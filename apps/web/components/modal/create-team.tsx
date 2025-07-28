//import { useContacts } from "@/components/providers/contacts";
import { useModal } from "@/hooks/use-modal";
import { TEAMS_QUERY } from "@/lib/QUERIES";
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
import { Input } from "@call/ui/components/input";
import { LoadingButton } from "@call/ui/components/loading-button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).trim(),
});

export const CreateTeam = () => {
  const { isOpen, onClose, type } = useModal();
  const queryClient = useQueryClient();

  const { mutate: createTeam, isPending } = useMutation({
    mutationFn: TEAMS_QUERY.createTeam,
    onMutate: async (newTeam) => {
      await queryClient.cancelQueries({ queryKey: ["teams"] });

      const previousTeams = queryClient.getQueryData(["teams"]);

      queryClient.setQueryData(["teams"], (old: any) => {
        if (!old) return old;

        const optimisticTeam = {
          id: `temp-${Date.now()}`,
          name: newTeam.name,
          creator_id: "current-user",
          members: [],
        };

        return [...old, optimisticTeam];
      });

      return { previousTeams };
    },
    onError: (err: any, newTeam, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTeams) {
        queryClient.setQueryData(["teams"], context.previousTeams);
      }
      toast.error("Failed to create team", {
        description: err.response?.data?.message || "Unknown error",
      });
    },
    onSuccess: (data) => {
      toast.success("Team created successfully");
      onClose();
      form.reset();
    },
    onSettled: () => {
      // Always refetch after error or success to ensure cache is in sync
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createTeam({
      name: data.name,
      members: [], // TODO: add members
    });
  };

  const isModalOpen = isOpen && type === "create-team";

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Team</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} placeholder="Enter team name" />
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
              Create Team
            </LoadingButton>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
