import CallSection from "@/components/app/section/call-section";
import { Suspense } from "react";

export default function CallPage() {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <CallSection />
      </Suspense>
    </>
  );
}
