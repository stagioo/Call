import { Header } from "../_components/page";
import { Icons } from "@call/ui/components/icons";
import { Button } from "@call/ui/components/button";
import { AllTeams } from "./_components/page";
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
