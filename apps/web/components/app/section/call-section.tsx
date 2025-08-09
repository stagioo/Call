"use client";

import { CallHistory } from "./_components/call-history";
import { JoinCallBox } from "./_components/join-call-box";

interface CallSectionProps {
  section: string;
}

const CallSection = ({ section }: CallSectionProps) => {
  const Sections = {
    joincall: (
      <div className="h-full w-full flex items-center justify-center">
        <JoinCallBox />
      </div>
    ),
    history: (
      <div className="h-full w-full">
        <CallHistory />
      </div>
    ),
  };

  return (
    <div className="px-10 h-full w-full">
      {Sections[section as keyof typeof Sections]}
    </div>
  );
};

export default CallSection;
