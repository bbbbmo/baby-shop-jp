"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { useSession } from "@/entities/auth";
import { signOut } from "@/shared/api/supabase";

export function MypageView() {
  const router = useRouter();
  const { user, loading } = useSession();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/signin");
    }
  }, [loading, user, router]);

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      console.error(error);
    }
    router.replace("/");
  };

  if (!user) {
    return null;
  }

  return <MypageContent email={user.email ?? ""} onLogout={handleLogout} />;
}

function MypageContent({
  email,
  onLogout,
}: {
  email: string;
  onLogout: () => void;
}) {
  const { d } = useLocale();
  return (
    <div className="mx-auto w-full max-w-480 px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-2xl font-bold text-foreground">{d.mypage.title}</h1>
        <p className="mb-6 text-sm text-foreground">
          <span className="text-muted">{d.mypage.emailLabel}</span>
          <br />
          {email}
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="w-full bg-foreground py-3 text-sm font-medium text-white hover:opacity-90"
        >
          {d.mypage.logoutButton}
        </button>
      </div>
    </div>
  );
}
