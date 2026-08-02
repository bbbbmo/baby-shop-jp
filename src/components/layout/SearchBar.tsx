"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { SearchIcon } from "@/shared/ui/icons";

export function SearchBar({ className = "" }: { className?: string }) {
  const { d } = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <form onSubmit={submit} className={`relative ${className}`}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={d.search.placeholder}
        aria-label={d.search.placeholder}
        className="h-10 w-full rounded-full border border-border bg-surface pl-4 pr-10 text-sm outline-none placeholder:text-muted focus:border-sage"
      />
      <button
        type="submit"
        aria-label={d.search.button}
        className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-foreground"
      >
        <SearchIcon />
      </button>
    </form>
  );
}
