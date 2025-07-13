"use client";

import { authClient } from "@call/auth/auth-client";
import { Button } from "@call/ui/components/button";
import { Icons } from "@call/ui/components/icons";

const SocialButton = () => {
  const handleGoogleLogin = async () => {
    const { data } = await authClient.signIn.social({
      provider: "google",
      callbackURL: process.env.NEXT_PUBLIC_CALLBACK_URL,
    });
    console.log(data);
  };

  return (
    <Button
      onClick={handleGoogleLogin}
      variant="outline"
      size="lg"
      className="px-10!"
    >
      <Icons.google className="h-4 w-4" />
      Continue with Google
    </Button>
  );
};

export default SocialButton;
