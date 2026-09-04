// provider 구현을 모아 두는 곳 — Route Handler 전용.
// PG가 추가되면 이 파일에 한 줄만 늘어난다.
import "server-only";
import { mockProvider } from "./providers/mock";
import type { PaymentProvider } from "./types";

// 가짜 결제사는 개발·테스트에만 등록한다. 이 가드는 복귀·취소 라우트를 막고,
// catalog의 필터는 시작 라우트를 막는다 — 서로 다른 경로다. 둘이 실제로
// 겹쳐서 막히는 것은 Task 7이 payment.provider와 URL의 provider를 대조한
// 뒤부터다.
const PROVIDERS: Record<string, PaymentProvider> =
  process.env.NODE_ENV === "production" ? {} : { [mockProvider.id]: mockProvider };

export function getProvider(id: string): PaymentProvider | null {
  return PROVIDERS[id] ?? null;
}
