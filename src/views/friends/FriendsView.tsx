"use client";

import { useLocale } from "@/shared/i18n/LocaleProvider";
import { useFriendLooks } from "@/entities/look";
import { SectionHeader } from "@/shared/ui/SectionHeader";
import { FriendsGrid } from "@/widgets/friends-section";

export function FriendsView() {
  const { d } = useLocale();
  const { data: looks = [] } = useFriendLooks();

  return (
    <div className="mx-auto max-w-480 px-6 py-8 sm:px-10">
      <SectionHeader title={d.friends.title} />
      <FriendsGrid looks={looks} />
    </div>
  );
}
