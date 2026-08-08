"use client";

import { useLocale } from "@/shared/i18n/LocaleProvider";

type QueryGuardProps = {
  isLoading: boolean;
  error: unknown;
  children: React.ReactNode;
};

export function QueryGuard({ isLoading, error, children }: QueryGuardProps) {
  const { d } = useLocale();
  if (isLoading) {
    return <div className="mx-auto max-w-480 px-6 py-16 sm:px-10" />;
  }
  if (error) {
    return (
      <p className="mx-auto max-w-480 px-6 py-16 text-center text-sm text-muted sm:px-10">
        {d.common.loadError}
      </p>
    );
  }
  return <>{children}</>;
}
