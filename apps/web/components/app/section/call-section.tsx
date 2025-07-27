"use client";

import { JoinCallBox } from "./_components/join-call-box";
import { CallHistory } from "./_components/call-history";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@call/ui/components/tabs";
import { useState } from "react";

const SECTIONS = [
  { key: "joincall", label: "Join Call" },
  { key: "history", label: "History" },
];

const CallSection = () => {
  const [section, setSection] = useState("joincall");

  return (
    <div className=" ">
      <Tabs value={section} onValueChange={setSection}>
        <TabsList className="mb-6 flex w-full justify-center">
          {SECTIONS.map((s) => (
            <TabsTrigger key={s.key} value={s.key} className="flex-1">
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="joincall">
          <JoinCallBox />
        </TabsContent>
        <TabsContent value="history">
          <CallHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CallSection;
