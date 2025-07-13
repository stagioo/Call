import { IconPlus } from "@tabler/icons-react";
import { Icons } from "@call/ui/components/icons";
import { Button } from "@call/ui/components/button";
const StackedAvatars = ({
  avatars = [],
  maxVisible = 3,
  size = "w-8 h-8",
  overlap = "ml-[-8px]",
}: {
  avatars?: Array<{ id: string; name: string; color?: string }>;
  maxVisible?: number;
  size?: string;
  overlap?: string;
}) => {
  const visibleAvatars = avatars.slice(0, maxVisible);
  const remainingCount = avatars.length - maxVisible;

  return (
    <div className="flex items-center">
      {visibleAvatars.map((avatar, index) => (
        <div
          key={avatar.id}
          className={`${size} ${index > 0 ? overlap : ""} rounded-full border-2 border-[#191919] flex items-center justify-center text-xs font-medium ${
            avatar.color || "bg-[#272727]"
          } text-[#d8d8d8] relative z-10`}
          style={{ zIndex: visibleAvatars.length - index }}
        >
          {avatar.name.charAt(0).toUpperCase()}
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={`${size} ${overlap} rounded-full border-2 border-[#191919] bg-[#272727] flex items-center justify-center text-xs font-medium text-[#d8d8d8] relative z-0`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export const TeamCard = () => {
  const participants = [
    { id: "1", name: "Alice", color: "bg-blue-500" },
    { id: "2", name: "Bob", color: "bg-green-500" },
    { id: "3", name: "Charlie", color: "bg-purple-500" },
    { id: "4", name: "Diana", color: "bg-red-500" },
    { id: "5", name: "Eve", color: "bg-yellow-500" },
  ];
  return (
    <div>
      <div>
        <div className="w-80  p-3 bg-[#191919] border border-[#272727] rounded-lg">
          {/* header */}
          <div className="flex items-start  justify-between">
            <div className="flex gap-3">
              <div className="border bg-[#191919] text-[#aaa] w-10 h-10 flex items-center justify-center rounded-lg">
                <Icons.teams />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm">Product Feedback</p>
                <span className="text-xs text-[#aaa]">05/07/2025</span>
              </div>
            </div>
            <div>
              <button className="text-[#aaa] cursor-pointer">
                <IconPlus size={18} />
              </button>
            </div>
          </div>

          {/* Participants section */}
          <div className="mt-3 flex flex-col items-center justify-between gap-2">
            <div className="w-full">
              <span className="text-xs text-[#aaa]">Members</span>
            </div>
            <div className="w-full flex items-center justify-between">
              <StackedAvatars avatars={participants} maxVisible={4} />
              <span className="text-xs text-[#aaa]">5</span>
            </div>
            <div className="w-full">
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
