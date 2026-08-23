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
      if (event === "SIGNED_IN") {
        void linkGuestOrdersToCurrentUser();
      }
    });
  }, []);

  useEffect(() => {
    // 뒤로가기로 bfcache에서 페이지가 복원되면 마운트/세션 재확인이 다시
    // 돌지 않아, 로그아웃 이후에도 로그인 당시 렌더링이 그대로 보인다.
    // 강제로 새로고침해 실제 세션 상태를 다시 확인하게 한다.
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
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
