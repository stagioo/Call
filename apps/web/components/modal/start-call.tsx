import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogTrigger,
} from "@call/ui/components/dialog";
import { Button } from "@call/ui/components/button";
import { useModal } from "@/hooks/use-modal";

export const StartCall = () => {
  const { isOpen, onClose, type } = useModal();

  const isModalOpen = isOpen && type === "start-call";

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogTrigger asChild>
        <Button>Start Call</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Call</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
