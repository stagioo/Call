import { Header } from "../_components/page";
import { Icons } from "@call/ui/components/icons";

const TeamsSection = () => {
  return (
    <div className="w-full h-full bg-[#171717] rounded-l-lg p-5 border border-[#222]">
      {/* content */}
      <div className="w-full h-full flex flex-col">
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
