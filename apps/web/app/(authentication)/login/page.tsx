"use client";

import { useState } from "react";
import SocialButton from "@/components/auth/social-button";
import EmailLoginForm from "@/components/auth/email-login-form";
import EmailSignupForm from "@/components/auth/email-signup-form";
import Logo from "@/components/shared/logo";
import { Separator } from "@call/ui/components/separator";
import { Button } from "@call/ui/components/button";
import type { Metadata } from "next";



const Page = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-6 w-full max-w-sm px-4">
        <Logo />
        <div className="w-full space-y-6">
          <div className="flex w-full rounded-lg border p-1">
            <Button
              type="button"
              variant={isLogin ? "secondary" : "ghost"}
              className="flex-1 rounded-md"
              onClick={() => setIsLogin(true)}
            >
              Login
            </Button>
            <Button
              type="button"
              variant={!isLogin ? "secondary" : "ghost"}
              className="flex-1 rounded-md"
              onClick={() => setIsLogin(false)}
            >
              Register
            </Button>
          </div>

          {isLogin ? <EmailLoginForm /> : <EmailSignupForm />}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <SocialButton />
        </div>
      </div>
    </div>
  );
};

export default Page;
