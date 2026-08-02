"use client";

import { useLocale } from "@/shared/i18n/LocaleProvider";
import { friendLooks } from "@/entities/look";
import { SectionHeader } from "@/shared/ui/SectionHeader";
import { FriendsGrid } from "@/widgets/friends-section";

export default function FriendsPage() {
  const { d } = useLocale();

  return (
    <div className="mx-auto max-w-480 px-6 py-8 sm:px-10">
      <SectionHeader title={d.friends.title} />
      <FriendsGrid looks={friendLooks} />
    </div>
  );
}
