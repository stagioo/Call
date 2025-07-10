import { IconPhone, IconUser } from "@tabler/icons-react";
import { MoreHorizontal } from "@geist-ui/icons";

// Stacked Avatars Component
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
          className={`${size} ${index > 0 ? overlap : ""} flex items-center justify-center rounded-full border-2 border-[#191919] text-xs font-medium ${
            avatar.color || "bg-[#272727]"
          } relative z-10 text-[#d8d8d8]`}
          style={{ zIndex: visibleAvatars.length - index }}
        >
          {avatar.name.charAt(0).toUpperCase()}
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={`${size} ${overlap} relative z-0 flex items-center justify-center rounded-full border-2 border-[#191919] bg-[#272727] text-xs font-medium text-[#d8d8d8]`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export const CallCard = () => {
  // Mock data for avatars
  const participants = [
    { id: "1", name: "Alice", color: "bg-blue-500" },
    { id: "2", name: "Bob", color: "bg-green-500" },
    { id: "3", name: "Charlie", color: "bg-purple-500" },
    { id: "4", name: "Diana", color: "bg-red-500" },
    { id: "5", name: "Eve", color: "bg-yellow-500" },
  ];

  return (
    <div>
      <div className="w-80 rounded-lg border border-[#272727] bg-[#191919] p-3">
        {/* header */}
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-[#191919] text-[#aaa]">
              <IconPhone size={18} />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm">Product Feedback</p>
              <span className="text-xs text-[#aaa]">05/07/2025</span>
            </div>
          </div>
          <div>
            <button className="cursor-pointer text-[#aaa]">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>

        {/* Participants section */}
        <div className="mt-3 flex items-center justify-between">
          <StackedAvatars avatars={participants} maxVisible={4} />
          <span className="text-xs text-[#aaa]">58:28</span>
        </div>
      </div>
    </div>
  );
};
