import { useModal } from "@/hooks/use-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@call/ui/components/dialog";

export const CreateTeam = () => {
  const { isOpen, onClose, type } = useModal();

  const isModalOpen = isOpen && type === "create-team";

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Team</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
