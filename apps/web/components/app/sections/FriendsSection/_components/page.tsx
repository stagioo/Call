import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@call/ui/components/avatar";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@call/ui/components/button";
export const Contact = () => {
  return (
    <div>
      <div className="w-full h-full flex py-5">
        {/* user */}
        <div className="w-full flex justify-between border-b border-border pb-5">
          <div className=" flex items-center gap-3">
            <div>
              <Avatar className="rounded-md w-8 h-8">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </div>
            <div>
              <span>Yassr Atti</span>
            </div>
          </div>
          <div className="flex gap-3">
            <div>
              <Button
                variant={"ghost"}
                className=" bg-[#272727] text-sm text-[#fff] hover:bg-[#272727"
              >
                <MoreHorizontal />
              </Button>
            </div>
            <div>
              <Button className="w-full bg-[#272727] text-sm text-[#fff] hover:bg-[#272727">
                Start Call
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
