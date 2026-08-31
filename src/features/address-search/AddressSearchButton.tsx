"use client";

import { useLocale } from "@/shared/i18n/LocaleProvider";

// 주소 칸은 읽기 전용이라 직접 못 쓴다. 이 버튼(과 주소 칸 클릭)이 유일한 입력 수단이다.
export function AddressSearchButton({ blocked, onOpen }: { blocked: boolean; onOpen: () => void }) {
  const { d } = useLocale();
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onOpen}
        className="h-11 w-full border border-foreground bg-surface text-sm text-foreground hover:bg-sand"
      >
        {d.checkout.addressSearchButton}
      </button>
      {blocked && <p className="text-sm text-sale">{d.checkout.addressSearchPopupBlocked}</p>}
    </div>
  );
}
