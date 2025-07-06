import { Button } from "@call/ui/components/button";
import { Input } from "@call/ui/components/input";
import { CallCard } from "./__componets/page";
export const JoinCall = () => {
  return (
    <div className="w-full h-full flex items-center justify-center">
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
            <Button className="bg-[#262626] w-full text-[#d8d8d8] hover:bg-[#262626]">
              Create one
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MyCalls = () => {
  return (
    <div className="w-full h-full flex py-5">
      <div>
        <CallCard />
      </div>
    </div>
  );
};

export const SharedWithMe = () => {
  return (
    <div className="w-full h-full flex py-5">
      <div>
        <CallCard />
      </div>
    </div>
  );
};

export const AllCalls = () => {
  return (
    <div className="w-full h-full flex py-5">
      <div>
        <CallCard />
      </div>
    </div>
  );
};
