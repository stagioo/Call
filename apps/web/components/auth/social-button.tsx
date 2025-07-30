"use client";

import { authClient } from "@call/auth/auth-client";
import { Button } from "@call/ui/components/button";
import { Icons } from "@call/ui/components/icons";
import { useState } from "react";

const SocialButton = () => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      console.log("Starting Google login...");
      console.log("Using callback URL:", process.env.NEXT_PUBLIC_CALLBACK_URL);
      
      const { data } = await authClient.signIn.social({
        provider: "google",
        callbackURL: process.env.NEXT_PUBLIC_CALLBACK_URL,
      });
      
      console.log("Login response:", data);
    } catch (error) {
      console.error("Google login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleGoogleLogin}
      variant="outline"
      size="lg"
      className="px-10!"
      disabled={loading}
    >
      {!loading && <Icons.google className="h-4 w-4" />}
      {loading ? "Connecting..." : "Continue with Google"}
    </Button>
  );
};

export default SocialButton;
