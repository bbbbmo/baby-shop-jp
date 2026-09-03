import type { Market } from "@/shared/config/markets";
import type { Localized } from "@/shared/i18n/types";

// 화면이 보는 결제수단 목록. provider 하나가 결제수단 여럿을 다루므로
// (국내 PG 직계약) provider와 method를 따로 들고 다닌다.
// 비밀키를 쓰는 코드는 providers/에만 있고 이 파일은 클라이언트에 내려가도 안전하다.
export type PaymentMethodOption = {
  id: string;
  provider: string;
  method: string;
  label: Localized;
  markets: readonly Market[];
};

export const PAYMENT_METHODS: readonly PaymentMethodOption[] = [
  {
    id: "mock",
    provider: "mock",
    method: "mock",
    label: { ja: "テスト決済", ko: "테스트 결제" },
    markets: ["kr", "jp"],
  },
];

// includeMock을 인자로 뺀 이유는 테스트 가능성 때문이다.
// 호출부는 기본값을 그대로 쓰면 된다.
export function paymentMethodsFor(
  market: Market,
  includeMock: boolean = process.env.NODE_ENV !== "production",
): PaymentMethodOption[] {
  return PAYMENT_METHODS.filter(
    (m) => m.markets.includes(market) && (includeMock || m.id !== "mock"),
  );
}

export function findPaymentMethod(id: string): PaymentMethodOption | null {
  return PAYMENT_METHODS.find((m) => m.id === id) ?? null;
}
