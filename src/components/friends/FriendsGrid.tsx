"use client";

import { useState } from "react";
import type { FriendLook } from "@/lib/types";
import { LookCard } from "./LookCard";
import { LookModal } from "./LookModal";

export function FriendsGrid({ looks }: { looks: FriendLook[] }) {
  const [selected, setSelected] = useState<FriendLook | null>(null);

  return (
    <>
      <div className="grid grid-cols-3 gap-x-1 gap-y-5 lg:grid-cols-4 xl:grid-cols-5">
        {looks.map((look) => (
          <LookCard key={look.id} look={look} onSelect={setSelected} />
        ))}
      </div>
      <LookModal look={selected} onClose={() => setSelected(null)} />
    </>
  );
}
