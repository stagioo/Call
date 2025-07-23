import { Tabs, TabsList, TabsTrigger, TabsContent } from "@call/ui/components/tabs";
import { Input } from "@call/ui/components/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@call/ui/components/input-otp";
import { Button } from "@call/ui/components/button";
import { Label } from "@call/ui/components/label";
import { useState } from "react";

export function JoinCallBox() {
  const [tab, setTab] = useState("link");
  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-background rounded-lg shadow">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="link" className="flex-1">Link</TabsTrigger>
          <TabsTrigger value="code" className="flex-1">code</TabsTrigger>
        </TabsList>
        <TabsContent value="link">
          <div className="mb-4">
            <Label htmlFor="call-link">link of the call</Label>
            <Input id="call-link" placeholder="Pega el enlace aquí" className="mt-2" />
          </div>
        </TabsContent>
        <TabsContent value="code">
          <div className="mb-4">
            <Label htmlFor="call-code">code of the call</Label>
            <InputOTP maxLength={6} className="mt-2" id="call-code">
              <InputOTPGroup>
                {[...Array(6)].map((_, i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
        </TabsContent>
      </Tabs>
      <Button className="w-full mt-2">join the call</Button>
    </div>
  );
} 