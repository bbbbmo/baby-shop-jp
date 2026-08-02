"use client";

import { useState } from "react";
import type { FriendLook } from "@/entities/look";
import { homeLooks } from "@/entities/look";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { SectionHeader } from "@/shared/ui/SectionHeader";
import { LookCard } from "./LookCard";
import { LookModal } from "./LookModal";

export function FriendsSection() {
  const { d } = useLocale();
  const [selected, setSelected] = useState<FriendLook | null>(null);

  return (
    <section className="mx-auto max-w-480 px-6 pt-16 sm:px-10">
      <SectionHeader title={d.friends.title} moreHref="/friends" />
      <ul className="no-scrollbar -mx-6 flex snap-x snap-mandatory gap-1 overflow-x-auto px-6 sm:-mx-10 sm:px-10 scroll-pl-6 sm:scroll-pl-10">
        {homeLooks().map((look) => (
          <li
            key={look.id}
            className="shrink-0 basis-[42%] snap-start sm:basis-[24%] lg:basis-[16%]"
          >
            <LookCard look={look} onSelect={setSelected} />
          </li>
        ))}
      </ul>
      <LookModal look={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
