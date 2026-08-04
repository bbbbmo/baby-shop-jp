"use client";

import { useLocale } from "@/shared/i18n/LocaleProvider";
import { GoogleIcon, LineIcon } from "@/shared/ui/icons";
import { signInWithOAuth } from "@/shared/api/supabase";

type SocialLoginButtonsProps = { onError: (message: string) => void };

export function SocialLoginButtons({ onError }: SocialLoginButtonsProps) {
  const { d } = useLocale();

  const handleClick = async (provider: "google" | "line") => {
    const { error } = await signInWithOAuth(provider, "signup");
    if (error) onError(d.signup.errors[error as keyof typeof d.signup.errors]);
  };

  return (
    <div className="space-y-2">
      <SocialButton
        icon={<GoogleIcon />}
        label={d.signup.googleButton}
        onClick={() => handleClick("google")}
      />
      <SocialButton
        icon={<LineIcon />}
        label={d.signup.lineButton}
        onClick={() => handleClick("line")}
      />
    </div>
  );
}

function SocialButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 border border-border bg-surface py-3 text-sm font-medium text-foreground hover:bg-sand"
    >
      {icon}
      {label}
    </button>
  );
}
