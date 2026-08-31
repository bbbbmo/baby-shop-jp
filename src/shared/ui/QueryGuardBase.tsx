"use client";

type QueryGuardBaseProps = {
  isLoading: boolean;
  error: unknown;
  errorText: string;
  children: React.ReactNode;
};

// 로케일 프로바이더가 없는 화면에서 쓴다. /admin은 [market] 밖이라
// LocaleProvider가 없고, 관리자 UI는 한국어 전용이라 문구를 직접 넘긴다.
// i18n에 의존하지 않도록 파일을 따로 둔다 — 같은 파일에 두면 관리자 화면이
// LocaleProvider를 함께 끌고 들어온다.
export function QueryGuardBase({ isLoading, error, errorText, children }: QueryGuardBaseProps) {
  if (isLoading) {
    return <div className="mx-auto max-w-480 px-6 py-16 sm:px-10" />;
  }
  if (error) {
    return (
      <p className="mx-auto max-w-480 px-6 py-16 text-center text-sm text-muted sm:px-10">
        {errorText}
      </p>
    );
  }
  return <>{children}</>;
}
