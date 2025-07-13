import { Button } from "@call/ui/components/button";
import { Input } from "@call/ui/components/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@call/ui/components/tabs";
import { Separator } from "@call/ui/components/separator";
import { CallCard } from "./__componets/page";
import CallModal from "../../callModal";
// import { useState } from "react";

import React, { useRef, useState } from "react";

export const JoinCall = () => {
  const [code, setCode] = useState(["8", "2", "w", "", "", ""]);
  const [tab, setTab] = useState("code");
  const codeRefs = Array.from({ length: 6 }, () =>
    useRef<HTMLInputElement>(null)
  );
  const [link, setLink] = useState("");

  // Convert code array to string with dash after third
  const codeString = code.slice(0, 3).join("") + "-" + code.slice(3).join("");

  // Handle input change for code fields
  const handleCodeChange = (idx: number, value: string) => {
    if (!/^[a-zA-Z0-9]?$/.test(value)) return; // Only allow single alphanumeric
    const newCode = [...code];
    newCode[idx] = value;
    setCode(newCode);
    // Auto-focus next input if value entered
    if (value && idx < 5) {
      codeRefs[idx + 1]?.current?.focus();
    }
  };

  // Handle backspace to focus previous
  const handleCodeKeyDown = (
    idx: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      codeRefs[idx - 1]?.current?.focus();
    }
  };

  // Handle paste for code fields
  const handleCodePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData
      .getData("Text")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 6);
    if (pasted.length > 1) {
      const newCode = pasted
        .split("")
        .concat(["", "", "", "", "", ""])
        .slice(0, 6);
      setCode(newCode);
      // Focus last filled
      const focusIndex = Math.min(pasted.length, 5);
      const focusRef = codeRefs[focusIndex]?.current;
      if (focusRef) {
        focusRef.focus();
      }
      e.preventDefault();
    }
  };

  // Handle link input change (for URL)
  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLink(e.target.value);
  };

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="border-1 border-offset-[-1px] inline-flex h-14 w-full items-center justify-center gap-1 self-stretch rounded-2xl border border-zinc-800 bg-[] p-1">
            <TabsTrigger
              value="code"
              className="h-full flex-1 rounded-[10px] data-[state=active]:bg-[#232323] data-[state=active]:text-white data-[state=inactive]:text-[#717171]"
            >
              Enter the code
            </TabsTrigger>
            <TabsTrigger
              value="link"
              className="h-full flex-1 rounded-[10px] data-[state=active]:bg-[#232323] data-[state=active]:text-white data-[state=inactive]:text-[#717171]"
            >
              Enter the link
            </TabsTrigger>
          </TabsList>
          <TabsContent value="code">
            <form className="mt-1 flex w-full flex-col items-center gap-[16]">
              <div className="flex w-full justify-center gap-2">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <React.Fragment key={idx}>
                    {idx === 3 && (
                      <span className="mx-1 flex items-center text-3xl text-[#444]">
                        -
                      </span>
                    )}
                    <Input
                      ref={codeRefs[idx]}
                      maxLength={1}
                      className="inline-flex h-14 w-full items-center justify-center overflow-hidden rounded-[22px] border-none bg-[#232323] text-center text-xl text-white text-zinc-300 shadow-[0px_0px_1px_0px_rgba(0,0,0,0.08),0px_1px_1px_0px_rgba(0,0,0,0.08),0px_2px_6.9px_-3px_rgba(0,0,0,0.25),inset_0px_0px_6.3px_0px_rgba(199,199,199,0.25)]
                       outline-none transition-all duration-200 placeholder:text-[#888] focus:translate-y-1 focus:ring-2 focus:ring-[#444] focus:rounded-[26px] "
                      placeholder={
                        idx === 0 ? "8" : idx === 1 ? "2" : idx === 2 ? "w" : ""
                      }
                      type="text"
                      autoComplete="off"
                      inputMode="text"
                      value={code[idx]}
                      onChange={(e) => handleCodeChange(idx, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(idx, e)}
                      onPaste={handleCodePaste}
                    />
                  </React.Fragment>
                ))}
              </div>
              <Button
                type="submit"
                className="active-[] inline-flex h-14 w-full items-center justify-center gap-2.5 self-stretch overflow-hidden rounded-2xl bg-neutral-800 px-2.5 py-2 text-gray-200 shadow-[inset_0px_0px_1px_0px_rgba(255,255,255,0.25)] transition-all duration-200 hover:bg-[] hover:shadow-[inset_0px_0px_10.800000190734863px_-1px_rgba(255,255,255,0.25)] focus:shadow-[inset_0px_0px_10.800000190734863px_-1px_rgba(255,255,255,0.25)] active:shadow-[inset_0px_0px_10.800000190734863px_2px_rgba(255,255,255,0.3)]"
              >
                Join now
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="link">
            <form className="mt-1 flex w-full flex-col items-center gap-[16]">
              <Input
                className="active:ring-animate-pulse inline-flex h-14 w-full items-center justify-center overflow-hidden rounded-[20px] border-none bg-[#232323]/50 text-center text-xl text-white text-zinc-300 outline-none ring-[0px_0px_1px_0px_rgba(0,0,0,0.08)] transition-all duration-200 placeholder:text-[#888] focus:ring-2 focus:ring-[#444] active:focus:ring-[#444]"
                placeholder="Paste the call link here"
                type="url"
                autoComplete="url"
                inputMode="text"
                value={link}
                onChange={handleLinkChange}
              />
              <Button
                type="submit"
                className="active-[] inline-flex h-14 w-full items-center justify-center gap-2.5 self-stretch overflow-hidden rounded-2xl bg-neutral-800 px-2.5 py-2 text-gray-200 shadow-[inset_0px_0px_1px_0px_rgba(255,255,255,0.25)] transition-all duration-200 hover:bg-[] hover:shadow-[inset_0px_0px_10.800000190734863px_-1px_rgba(255,255,255,0.25)] focus:shadow-[inset_0px_0px_10.800000190734863px_-1px_rgba(255,255,255,0.25)] active:shadow-[inset_0px_0px_10.800000190734863px_2px_rgba(255,255,255,0.3)]"
              >
                Join now
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
      {/* <CallModal open={CallModal} onClose={() => setShowCallModal(false)} /> */}
    </div>
  );
};

export const MyCalls = () => {
  return (
    <div className="flex h-full w-full py-5">
      <div>
        <CallCard />
      </div>
    </div>
  );
};

export const SharedWithMe = () => {
  return (
    <div className="flex h-full w-full py-5">
      <div>
        <CallCard />
      </div>
    </div>
  );
};

export const AllCalls = () => {
  return (
    <div className="flex h-full w-full py-5">
      <div>
        <CallCard />
      </div>
    </div>
  );
};
