import SocialButton from "@/components/auth/social-button";
import Logo from "@/components/shared/logo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your account",
};

const Page = () => {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-4">
        <Logo />
        <SocialButton />
      </div>
    </div>
  );
};

export default Page;
