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
    <div className="w-full pb-5 border-b border-[#202020]">
      <div className="w-full h-full flex items-center justify-between">
        {/* indicator */}
        <div className="flex items-center gap-3">
          <button className="bg-inherit text-[#d8d8d8] border border-[#222] text-xl border-1 rounded-lg w-10 h-10 flex items-center justify-center">
            {icon}
          </button>
          <span className="text-sm">{title}</span>
        </div>
        {/* CTA section and notification */}
        <div className="flex items-center gap-3">
          {showNotification && (
            <button
              className="h-10 w-10 bg-[#272727] flex items-center justify-center rounded-lg cursor-pointer text-[#d8d8d8] hover:bg-[#272727]"
              onClick={onNotificationClick}
            >
              <IconBell size={18} />
            </button>
          )}
          {ctaText && (
            <Button
              className="bg-[#272727] h-10 cursor-pointer text-sm text-[#d8d8d8] hover:bg-[#272727]"
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
