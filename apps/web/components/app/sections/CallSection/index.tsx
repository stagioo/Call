"use client";
import { IconPhone } from "@tabler/icons-react";
import { Button } from "@call/ui/components/button";
import { JoinCall, MyCalls, SharedWithMe, AllCalls } from "./_components/page";
import { Header } from "../_components/page";
import { useState } from "react";
import CallModal from "../callModal";

const CallsSection = () => {
  const [showCallModal, setShowCallModal] = useState(false)
  const [activeTab, setActiveTab] = useState<"join" | "my" | "shared" | "all">(
    "join"
  );

  const renderContent = () => {
    switch (activeTab) {
      case "join":
        return <JoinCall />;
      case "my":
        return <MyCalls />;
      case "shared":
        return <SharedWithMe />;
      case "all":
        return <AllCalls />;
      default:
        return <JoinCall />;
    }
  };

  return (
    <div className="w-full h-full bg-[#171717] rounded-l-lg  p-5 border border-[#222]">
      {/* content */}
      <div className="w-full h-full flex flex-col">
        {/* header */}
        <Header
          icon={<IconPhone size={18} />}
          title="Calls"
          ctaText="Start Call"
          onCtaClick={() => setShowCallModal(true)}
          onNotificationClick={() => console.log("Notification clicked")}
        />
        {/* Actions */}
        <div className="h-20  flex  ">
          <Button
            className={`rounded-none bg-inherit h-full border-b text-sm hover:bg-inherit ${
              activeTab === "join"
                ? "border-[#252525] text-[#fff]"
                : "border-transparent text-[#aaa]"
            }`}
            onClick={() => setActiveTab("join")}
          >
            Join call
          </Button>
          <Button
            className={`rounded-none bg-inherit h-full border-b text-sm hover:bg-inherit ${
              activeTab === "my"
                ? "border-[#252525] text-[#fff]"
                : "border-transparent text-[#aaa]"
            }`}
            onClick={() => setActiveTab("my")}
          >
            My calls
          </Button>
          <Button
            className={`rounded-none bg-inherit h-full border-b text-sm hover:bg-inherit ${
              activeTab === "shared"
                ? "border-[#252525] text-[#fff]"
                : "border-transparent text-[#aaa]"
            }`}
            onClick={() => setActiveTab("shared")}
          >
            Shared with me
          </Button>
          <Button
            className={`rounded-none bg-inherit h-full border-b text-sm hover:bg-inherit ${
              activeTab === "all"
                ? "border-[#252525] text-[#fff]"
                : "border-transparent text-[#aaa]"
            }`}
            onClick={() => setActiveTab("all")}
          >
            All calls
          </Button>
        </div>
        {/* Content based on selected tab */}
        <div className="w-full h-full">{renderContent()}</div>
      </div>
      <CallModal open={showCallModal} onClose={() => setShowCallModal(false)} />
    </div>
  );
};

export default CallsSection;
