"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { subscribeToAuthChanges, linkGuestOrdersToCurrentUser, type User } from "@/shared/api/supabase";

type SessionContextValue = {
  user: User | null;
  loading: boolean;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return subscribeToAuthChanges((nextUser, event) => {
      setUser(nextUser);
      setLoading(false);
      if (event === "SIGNED_IN" && nextUser?.email) {
        void linkGuestOrdersToCurrentUser(nextUser.email);
      }
    });
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({ user, loading }),
    [user, loading],
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return ctx;
}
