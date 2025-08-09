"use client";

import { Input } from "@call/ui/components/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@call/ui/components/input-otp";
import { Button } from "@call/ui/components/button";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function JoinCallBox() {
  const [joinMethod, setJoinMethod] = useState<"link" | "code">("code");
  const [link, setLink] = useState("");
  const [code, setCode] = useState("");
  const router = useRouter();

  const handleJoin = () => {
    if (joinMethod === "link" && link) {
      try {
        const url = new URL(link.startsWith("http") ? link : `https://${link}`);
        const pathParts = url.pathname.split("/").filter(Boolean);
        const callIdentifier = pathParts.pop();
        if (callIdentifier) router.push(`/app/call/${callIdentifier}`);
        else window.location.href = link;
      } catch (error) {
        window.location.href = link;
      }
    } else if (joinMethod === "code" && code.length === 6) {
      router.push(`/app/call/${code}`);
    }
  };

  const isButtonDisabled =
    (joinMethod === "link" && !link.trim()) ||
    (joinMethod === "code" && code.length !== 6);

  return (
    <div className="w-full flex items-center justify-center p-4">
      <div className="w-[404px] max-w-full space-y-4">
        {/* Toggle: Enter the code | Enter the link */}
        <div className="flex w-full items-stretch gap-[5px] rounded-[10px] border border-[#282828] p-[4.5px]">
          <button
            type="button"
            onClick={() => setJoinMethod("code")}
            className={`flex-1 rounded-[7.76px] px-3 py-2 text-[15.5px] font-medium tracking-[-0.02em] ${
              joinMethod === "code"
                ? "bg-[#282828] text-white"
                : "text-white/80"
            }`}
          >
            Enter the code
          </button>
          <button
            type="button"
            onClick={() => setJoinMethod("link")}
            className={`flex-1 rounded-[11.08px] px-3 py-2 text-[15.5px] font-medium tracking-[-0.02em] ${
              joinMethod === "link"
                ? "bg-[#282828] text-white"
                : "text-white/80"
            }`}
          >
            Enter the link
          </button>
        </div>

        {/* Inputs */}
        {joinMethod === "code" ? (
          <div className="flex w-full items-center justify-center gap-[9px]">
            <InputOTP
              id="call-code"
              maxLength={6}
              value={code}
              onChange={setCode}
            >
              <InputOTPGroup className="flex items-center gap-[9px]">
                <InputOTPSlot
                  index={0}
                  className="h-[55.43px] w-[55.43px] rounded-[10px] text-[22.17px] font-medium bg-[#282828] text-[#EDEDED] shadow-[0_0_1.11px_rgba(0,0,0,0.08),0_1.11px_1.11px_rgba(0,0,0,0.08),0_2.22px_7.65px_-3.33px_rgba(0,0,0,0.25),inset_0_0_1.66px_rgba(199,199,199,0.25)] empty:bg-white/5 empty:text-white empty:shadow-[0_0_1.11px_rgba(0,0,0,0.08),0_1.11px_1.11px_rgba(0,0,0,0.08),0_2.22px_7.65px_-3.33px_rgba(0,0,0,0.25),inset_0_0_6.98px_rgba(199,199,199,0.25),inset_0_0_6.98px_rgba(199,199,199,0.25)]"
                />
                <InputOTPSlot
                  index={1}
                  className="h-[55.43px] w-[55.43px] rounded-[10px] text-[22.17px] font-medium bg-[#282828] text-[#EDEDED] shadow-[0_0_1.11px_rgba(0,0,0,0.08),0_1.11px_1.11px_rgba(0,0,0,0.08),0_2.22px_7.65px_-3.33px_rgba(0,0,0,0.25),inset_0_0_1.66px_rgba(199,199,199,0.25)] empty:bg-white/5 empty:text-white empty:shadow-[0_0_1.11px_rgba(0,0,0,0.08),0_1.11px_1.11px_rgba(0,0,0,0.08),0_2.22px_7.65px_-3.33px_rgba(0,0,0,0.25),inset_0_0_6.98px_rgba(199,199,199,0.25),inset_0_0_6.98px_rgba(199,199,199,0.25)]"
                />
                <InputOTPSlot
                  index={2}
                  className="h-[55.43px] w-[55.43px] rounded-[10px] text-[22.17px] font-medium bg-[#282828] text-[#EDEDED] shadow-[0_0_1.11px_rgba(0,0,0,0.08),0_1.11px_1.11px_rgba(0,0,0,0.08),0_2.22px_7.65px_-3.33px_rgba(0,0,0,0.25),inset_0_0_1.66px_rgba(199,199,199,0.25)] empty:bg-white/5 empty:text-white empty:shadow-[0_0_1.11px_rgba(0,0,0,0.08),0_1.11px_1.11px_rgba(0,0,0,0.08),0_2.22px_7.65px_-3.33px_rgba(0,0,0,0.25),inset_0_0_6.98px_rgba(199,199,199,0.25),inset_0_0_6.98px_rgba(199,199,199,0.25)]"
                />
                <div className="h-[5px] w-[18px] rounded-full bg-[#282828]" />
                <InputOTPSlot
                  index={3}
                  className="h-[55.43px] w-[55.43px] rounded-[10px] text-[22.17px] font-medium bg-[#282828] text-[#EDEDED] shadow-[0_0_1.11px_rgba(0,0,0,0.08),0_1.11px_1.11px_rgba(0,0,0,0.08),0_2.22px_7.65px_-3.33px_rgba(0,0,0,0.25),inset_0_0_1.66px_rgba(199,199,199,0.25)] empty:bg-white/5 empty:text-white empty:shadow-[0_0_1.11px_rgba(0,0,0,0.08),0_1.11px_1.11px_rgba(0,0,0,0.08),0_2.22px_7.65px_-3.33px_rgba(0,0,0,0.25),inset_0_0_6.98px_rgba(199,199,199,0.25),inset_0_0_6.98px_rgba(199,199,199,0.25)]"
                />
                <InputOTPSlot
                  index={4}
                  className="h-[55.43px] w-[55.43px] rounded-[10px] text-[22.17px] font-medium bg-[#282828] text-[#EDEDED] shadow-[0_0_1.11px_rgba(0,0,0,0.08),0_1.11px_1.11px_rgba(0,0,0,0.08),0_2.22px_7.65px_-3.33px_rgba(0,0,0,0.25),inset_0_0_1.66px_rgba(199,199,199,0.25)] empty:bg-white/5 empty:text-white empty:shadow-[0_0_1.11px_rgba(0,0,0,0.08),0_1.11px_1.11px_rgba(0,0,0,0.08),0_2.22px_7.65px_-3.33px_rgba(0,0,0,0.25),inset_0_0_6.98px_rgba(199,199,199,0.25),inset_0_0_6.98px_rgba(199,199,199,0.25)]"
                />
                <InputOTPSlot
                  index={5}
                  className="h-[55.43px] w-[55.43px] rounded-[10px] text-[22.17px] font-medium bg-[#282828] text-[#EDEDED] shadow-[0_0_1.11px_rgba(0,0,0,0.08),0_1.11px_1.11px_rgba(0,0,0,0.08),0_2.22px_7.65px_-3.33px_rgba(0,0,0,0.25),inset_0_0_1.66px_rgba(199,199,199,0.25)] empty:bg-white/5 empty:text-white empty:shadow-[0_0_1.11px_rgba(0,0,0,0.08),0_1.11px_1.11px_rgba(0,0,0,0.08),0_2.22px_7.65px_-3.33px_rgba(0,0,0,0.25),inset_0_0_6.98px_rgba(199,199,199,0.25),inset_0_0_6.98px_rgba(199,199,199,0.25)]"
                />
              </InputOTPGroup>
            </InputOTP>
          </div>
        ) : (
          <div className="flex w-full items-center justify-center">
            <Input
              id="call-link"
              placeholder="Paste your meeting link"
              className="h-[55.43px] w-full rounded-[10px] bg-white/5 text-base text-white placeholder:text-white/60"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>
        )}

        {/* Join now button */}
        <div className="w-full">
          <Button
            className="h-[55.43px] w-full rounded-[15.52px] bg-[#282828] hover:bg-[#282828] text-white hover:text-white shadow-[inset_0_0_1.66px_rgba(199,199,199,0.25)] hover:shadow-[inset_0_0_6.98px_rgba(199,199,199,0.25)] transition-shadow text-[22.17px] font-medium tracking-[-0.02em]"
            onClick={handleJoin}
            disabled={isButtonDisabled}
          >
            Join now
          </Button>
        </div>
      </div>
    </div>
  );
}
