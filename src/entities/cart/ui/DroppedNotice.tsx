"use client";

import { useLocale } from "@/shared/i18n/LocaleProvider";

// 마켓을 옮기면 그 마켓에서 취급하지 않는 상품이 장바구니에서 빠진다.
// 장바구니와 체크아웃 두 곳에서 같은 안내를 써야 해서 엔티티로 올렸다.
export function DroppedNotice({ count }: { count: number }) {
  const { d } = useLocale();
  if (count === 0) {
    return null;
  }
  return (
    <p className="mb-4 border border-border bg-sand px-4 py-3 text-sm text-foreground">
      {d.cart.droppedNotice.replace("{count}", String(count))}
    </p>
  );
}
