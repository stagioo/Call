import { authClient } from "@call/auth/auth-client";
import { useEffect, useState } from "react";

export type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Session = {
  user: User;
  session: {
    id: string;
    expiresAt: Date;
    token: string;
    createdAt: Date;
    updatedAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
    userId: string;
  };
};

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const getSession = async () => {
      try {
        setIsLoading(true);
        const { data } = await authClient.getSession();
        setSession(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to get session"));
      } finally {
        setIsLoading(false);
      }
    };

    getSession();
  }, []);

  return { session, isLoading, error };
} 