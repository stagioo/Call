import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@call/ui/components/dialog";
import { Button } from "@call/ui/components/button";
import { useModal } from "@/hooks/use-modal";

export const CreateTeam = () => {
  const { isOpen, onClose, type } = useModal();

  const isModalOpen = isOpen && type === "create-team";

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogTrigger asChild>
        <Button>Create Team</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Team</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
