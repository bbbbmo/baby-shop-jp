"use client";

import { GoogleIcon, KakaoIcon, LineIcon } from "@/shared/ui/icons";
import { signInWithOAuth } from "@/shared/api/supabase";

type OAuthProvider = "google" | "line" | "kakao";

type SocialLoginButtonsProps = {
  from: "signup" | "signin";
  googleLabel: string;
  lineLabel: string;
  kakaoLabel: string;
  errors: Record<string, string>;
  onError: (message: string) => void;
};

// 카카오 로그인 디자인 가이드가 규정하는 값: 컨테이너 #FEE500, 심볼 #000000,
// 레이블 #000000 85%. 규정 외 색상은 적용할 수 없어 hover에도 색을 바꾸지 않는다.
// 모서리는 전역 각진 규칙(border-radius: 0)을 그대로 따른다.
const VARIANT_CLASS: Record<"neutral" | "kakao", string> = {
  neutral: "border border-border bg-surface text-foreground hover:bg-sand",
  kakao: "bg-[#FEE500] text-[rgba(0,0,0,0.85)]",
};

export function SocialLoginButtons({
  from,
  googleLabel,
  lineLabel,
  kakaoLabel,
  errors,
  onError,
}: SocialLoginButtonsProps) {
  const handleClick = async (provider: OAuthProvider) => {
    const { error } = await signInWithOAuth(provider, from);
    if (error) onError(errors[error] ?? errors.unknownError);
  };

  return (
    <div className="space-y-2">
      <SocialButton icon={<GoogleIcon />} label={googleLabel} onClick={() => handleClick("google")} />
      <SocialButton icon={<LineIcon />} label={lineLabel} onClick={() => handleClick("line")} />
      <SocialButton
        icon={<KakaoIcon />}
        label={kakaoLabel}
        variant="kakao"
        onClick={() => handleClick("kakao")}
      />
    </div>
  );
}

function SocialButton({
  icon,
  label,
  onClick,
  variant = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "neutral" | "kakao";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-center gap-2 py-3 text-sm font-medium ${VARIANT_CLASS[variant]}`}
    >
      {icon}
      {label}
    </button>
  );
}
