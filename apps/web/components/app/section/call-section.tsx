import { JoinCallBox } from "./_components/join-call-box";
import { CallHistory } from "./_components/call-history";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@call/ui/components/tabs";
import { useState } from "react";

const SECTIONS = [
  { key: "joincall", label: "Join Call" },
  { key: "history", label: "History" },
];

const CallSection = () => {
  const [section, setSection] = useState("joincall");
  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-background rounded-lg shadow">
      <Tabs value={section} onValueChange={setSection}>
        <TabsList className="w-full mb-6 flex justify-center ">
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
