import { Tabs, TabsList, TabsTrigger, TabsContent } from "@call/ui/components/tabs";
import { Input } from "@call/ui/components/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@call/ui/components/input-otp";
import { Button } from "@call/ui/components/button";
import { Label } from "@call/ui/components/label";
import { useState } from "react";
import { JoinCallBox } from "./_components/join-call-box";
const CallSection = () => {
  return (
    <div>
      <JoinCallBox />
    </div>
  );
};

export default CallSection;
