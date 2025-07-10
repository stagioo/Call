import { Header } from "../_components/page";
import { Icons } from "@call/ui/components/icons";

const TeamsSection = () => {
  return (
    <div className="h-full w-full rounded-l-lg border border-[#222] bg-[#171717] p-5">
      {/* content */}
      <div className="flex h-full w-full flex-col">
        {/* header */}
        <Header
          icon={<Icons.teams />}
          title="Teams"
          ctaText="Create team"
          onCtaClick={() => console.log("Start Call clicked")}
          onNotificationClick={() => console.log("Notification clicked")}
        />
      </div>
    </div>
  );
};

export default TeamsSection;
