"use client";

import { CallHistory } from "./_components/call-history";
import { JoinCallBox } from "./_components/join-call-box";

interface CallSectionProps {
  section: string;
}

const CallSection = ({ section }: CallSectionProps) => {
  const Sections = {
    joincall: <JoinCallBox />,
    history: <CallHistory />,
  };

  return (
    <div className="px-10 h-full w-full flex items-center justify-center">{Sections[section as keyof typeof Sections]}</div>
  );
};

export default CallSection;
