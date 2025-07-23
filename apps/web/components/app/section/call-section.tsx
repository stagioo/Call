import { JoinCallBox } from "./_components/join-call-box";
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
        <TabsList className="w-full mb-6">
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
          <div className="p-8 text-center text-muted-foreground">History section (coming soon)</div>
        </TabsContent>
   
      </Tabs>
    </div>
  );
};

export default CallSection;
