"use client";

import type { FriendLook } from "@/lib/types";
import { lookAlt } from "@/lib/friends";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { LookImage } from "./LookImage";

type Props = {
  look: FriendLook;
  onSelect: (look: FriendLook) => void;
};

export function LookCard({ look, onSelect }: Props) {
  const { locale } = useLocale();

  return (
    <button
      type="button"
      onClick={() => onSelect(look)}
      className="group block w-full text-left"
    >
      <div className="overflow-hidden">
        <LookImage
          look={look}
          alt={lookAlt(look, locale)}
          className="transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-2 space-y-0.5">
        <p className="truncate text-[11px] text-foreground sm:text-xs">
          {look.handle}
        </p>
        <p className="truncate text-[11px] text-muted sm:text-xs">
          {look.modelInfo[locale]}
        </p>
      </div>
    </button>
  );
}
