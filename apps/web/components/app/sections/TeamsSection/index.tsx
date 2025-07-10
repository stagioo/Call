import { Header } from "../_components/page";
import { Icons } from "@call/ui/components/icons";
import { Button } from "@call/ui/components/button";
import { AllTeams } from "./_components/page";
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
        <div className="h-20 flex ">
          <Button className="rounded-none bg-inherit h-full border-b text-sm hover:bg-inherit border-[#252525] text-[#fff]">
            All teams
          </Button>
        </div>
        <div className="w-full h-full">
          <AllTeams />
        </div>
      </div>
    </div>
  );
};

export default TeamsSection;
