import { useModal } from "@/hooks/use-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@call/ui/components/dialog";
import { UserProfile } from "@call/ui/components/use-profile";
import { ScrollArea } from "@call/ui/components/scroll-area";
import { Badge } from "@call/ui/components/badge";
import { FiUsers, FiCalendar, FiClock } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";

export const ViewParticipants = () => {
  const { isOpen, onClose, type, data } = useModal();
  const isModalOpen = isOpen && type === "view-participants";

  // Defensive checks
  const participants = data?.participants || [];
  const callInfo = data?.callInfo;

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-md p-6 bg-[#232323] rounded-2xl" showCloseButton={false}>
        <DialogHeader className="flex flex-col  ">
          <DialogTitle>{callInfo?.name || "Call"} Participants</DialogTitle>
          <DialogDescription>
            {participants.length} participant(s) in this call
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[500px] pr-4">
          <div className="space-y-4">
            {participants.length > 0 ? (
              participants.map((participant, index: number) => (
                <div
                  key={participant.id || index}
                  className="flex items-center gap-4 rounded-lg border-1 border-[#434343] bg-[#2F2F2F] p-3 transition-colors hover:bg-white/5"
                >
                  <UserProfile
                    name={participant.name || "Unknown"}
                    url={participant.image}
                    size="sm"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h4 className="truncate font-medium">
                        {participant.name || "Unknown"}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        Participant
                      </Badge>
                    </div>

                    <p className="text-muted-foreground mb-2 truncate text-sm">
                      {participant.email || "No email provided"}
                    </p>

                    <div className="text-muted-foreground flex items-center gap-4 text-xs">
                    

                      {participant.leftAt && (
                        <div className="flex items-center gap-1">
                          <FiClock className="h-3 w-3" />
                          <span>
                            Left{" "}
                            {formatDistanceToNow(new Date(participant.leftAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <div className="bg-muted/50 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full p-4">
                  <FiUsers className="text-muted-foreground h-8 w-8" />
                </div>
                <h3 className="mb-2 font-medium">No participants found</h3>
                <p className="text-muted-foreground text-sm">
                  This call doesn't have any recorded participants.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
