import { IconBell } from "@tabler/icons-react";
import { Button } from "@call/ui/components/button";
import type { ReactNode } from "react";

interface HeaderProps {
  icon: ReactNode;
  title: string;
  showNotification?: boolean;
  ctaText?: string;
  onCtaClick?: () => void;
  onNotificationClick?: () => void;
}

export const Header = ({
  icon,
  title,
  showNotification = true,
  ctaText,
  onCtaClick,
  onNotificationClick,
}: HeaderProps) => {
  return (
    <div className="w-full border-b border-[#202020] pb-5">
      <div className="flex h-full w-full items-center justify-between">
        {/* indicator */}
        <div className="flex items-center gap-3">
          <button className="border-1 flex h-10 w-10 items-center justify-center rounded-lg border border-[#222] bg-inherit text-xl text-[#d8d8d8]">
            {icon}
          </button>
          <span className="text-sm">{title}</span>
        </div>
        {/* CTA section and notification */}
        <div className="flex items-center gap-3">
          {showNotification && (
            <button
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-[#272727] text-[#d8d8d8] hover:bg-[#272727]"
              onClick={onNotificationClick}
            >
              <IconBell size={18} />
            </button>
          )}
          {ctaText && (
            <Button
              className="h-10 cursor-pointer bg-[#272727] text-sm text-[#d8d8d8] hover:bg-[#272727]"
              onClick={onCtaClick}
            >
              {ctaText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
