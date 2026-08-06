"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { useSession } from "@/entities/auth";
import { signOut } from "@/shared/api/supabase";
import { ProfileCard } from "./ProfileCard";

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

  return (
    <MypageContent
      email={user.email ?? ""}
      name={readMetadataField(user.user_metadata, "name")}
      furigana={readMetadataField(user.user_metadata, "furigana")}
      phone={readMetadataField(user.user_metadata, "phone")}
      onLogout={handleLogout}
    />
  );
}

function readMetadataField(metadata: Record<string, unknown>, key: string): string {
  const value = metadata[key];
  return typeof value === "string" ? value : "";
}

function MypageContent({
  email,
  name,
  furigana,
  phone,
  onLogout,
}: {
  email: string;
  name: string;
  furigana: string;
  phone: string;
  onLogout: () => void;
}) {
  const { d } = useLocale();
  return (
    <div className="mx-auto w-full max-w-480 px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-2xl font-bold text-foreground">{d.mypage.title}</h1>
        <ProfileCard email={email} name={name} furigana={furigana} phone={phone} />
        <div className="mt-8 border-t border-border pt-6">
          <button
            type="button"
            onClick={onLogout}
            className="w-full border border-border py-2.5 text-sm font-medium text-foreground hover:bg-sand"
          >
            {d.mypage.logoutButton}
          </button>
        </div>
      </div>
    </div>
  );
}
