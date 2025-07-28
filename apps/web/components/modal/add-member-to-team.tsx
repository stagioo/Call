import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@call/ui/components/dialog";
import { useModal } from "@/hooks/use-modal";

const AddMemberToTeam = () => {
  const { isOpen, onClose, type } = useModal();

  const isModalOpen = isOpen && type === "add-member-to-team";

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Member to Team</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default AddMemberToTeam;
