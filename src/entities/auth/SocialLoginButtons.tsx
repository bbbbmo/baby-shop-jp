"use client";

import { GoogleIcon, LineIcon } from "@/shared/ui/icons";
import { signInWithOAuth } from "@/shared/api/supabase";

type SocialLoginButtonsProps = {
  from: "signup" | "signin";
  googleLabel: string;
  lineLabel: string;
  errors: Record<string, string>;
  onError: (message: string) => void;
};

export function SocialLoginButtons({
  from,
  googleLabel,
  lineLabel,
  errors,
  onError,
}: SocialLoginButtonsProps) {
  const handleClick = async (provider: "google" | "line") => {
    const { error } = await signInWithOAuth(provider, from);
    if (error) onError(errors[error] ?? errors.unknownError);
  };

  return (
    <div className="space-y-2">
      <SocialButton icon={<GoogleIcon />} label={googleLabel} onClick={() => handleClick("google")} />
      <SocialButton icon={<LineIcon />} label={lineLabel} onClick={() => handleClick("line")} />
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
