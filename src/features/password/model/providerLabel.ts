import type { Dictionary } from "@/shared/i18n/dictionaries";

type ProviderKey = keyof Dictionary["password"]["providers"];

// 사전에 없는 provider가 와도 화면이 비지 않게 원래 문자열을 그대로 쓴다.
export function providerLabel(d: Dictionary, provider: string): string {
  return d.password.providers[provider as ProviderKey] ?? provider;
}
