import { Button } from "@call/ui/components/button";
import { Input } from "@call/ui/components/input";
import { CallCard } from "./__componets/page";
import CallModal from "../../callModal";
import { useState } from "react";

export const JoinCall = () => {
  const [showCallModal, setShowCallModal] = useState(false);

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div>
          <h1 className="text-2xl font-medium">Join call or create one</h1>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <Input placeholder="Enter code or link"></Input>
            <Button className="bg-[#262626] text-[#d8d8d8] hover:bg-[#262626]">
              Join call
            </Button>
          </div>
          <div>

            <Button className="w-full bg-[#262626] text-[#d8d8d8] hover:bg-[#262626]">
              Create one
            </Button>
          </div>
        </div>
      </div>
      <CallModal open={showCallModal} onClose={() => setShowCallModal(false)} />
    </div>
  );
};

export const MyCalls = () => {
  return (
    <div className="flex h-full w-full py-5">
      <div>
        <CallCard />
      </div>
    </div>
  );
};

export const SharedWithMe = () => {
  return (
    <div className="flex h-full w-full py-5">
      <div>
        <CallCard />
      </div>
    </div>
  );
};

export const AllCalls = () => {
  return (
    <div className="flex h-full w-full py-5">
      <div>
        <CallCard />
      </div>
    </div>
  );
};
