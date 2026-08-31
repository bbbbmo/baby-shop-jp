"use client";

import { useLocale } from "@/shared/i18n/LocaleProvider";
import { QueryGuardBase } from "./QueryGuardBase";

type QueryGuardProps = {
  isLoading: boolean;
  error: unknown;
  children: React.ReactNode;
};

// 스토어프론트용. 문구를 사전에서 가져온다.
export function QueryGuard({ isLoading, error, children }: QueryGuardProps) {
  const { d } = useLocale();
  return (
    <QueryGuardBase isLoading={isLoading} error={error} errorText={d.common.loadError}>
      {children}
    </QueryGuardBase>
  );
}
