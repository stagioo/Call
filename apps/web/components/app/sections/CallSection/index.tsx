"use client";
import { IconPhone, IconBell } from "@tabler/icons-react";
import { Button } from "@call/ui/components/button";
import { JoinCall, MyCalls, SharedWithMe, AllCalls } from "./_components/page";
import { useState } from "react";

const CallsSection = () => {
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
        <div className="w-full pb-5   border-b border-[#202020]">
          <div className="w-full h-full flex items-center justify-between">
            {/* indicator */}
            <div className="flex items-center gap-3">
              <button className="bg-inherit text-[#d8d8d8] border border-[#222] border-1 rounded-lg w-10 h-10 flex items-center justify-center">
                <IconPhone size={18} />
              </button>
              <span className="text-sm">Calls</span>
            </div>
            {/* CTA section and notification */}
            <div className="flex items-center gap-3">
              <button className="h-10 w-10 bg-[#272727] flex items-center justify-center rounded-lg cursor-pointer  text-[#d8d8d8] hover:bg-[#272727]">
                <IconBell size={18} />
              </button>
              <Button className="bg-[#272727] h-10 cursor-pointer text-sm  text-[#d8d8d8] hover:bg-[#272727]">
                Start Call
              </Button>
            </div>
          </div>
        </div>
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
    </div>
  );
};

export default CallsSection;
