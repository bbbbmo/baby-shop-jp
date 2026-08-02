"use client";

import { useLocale } from "@/shared/i18n/LocaleProvider";

export type SortKey = "recommended" | "priceAsc" | "priceDesc" | "new";
export type SeasonKey = "all" | "ss" | "aw";

type Props = {
  sizeOptions: string[];
  season: SeasonKey;
  sizes: string[];
  sort: SortKey;
  onSeason: (v: SeasonKey) => void;
  onSizes: (v: string[]) => void;
  onSort: (v: SortKey) => void;
};

export function FilterBar(props: Props) {
  const { d } = useLocale();
  const seasons: SeasonKey[] = ["all", "ss", "aw"];
  const seasonLabel: Record<SeasonKey, string> = {
    all: d.filter.all,
    ss: d.filter.ss,
    aw: d.filter.aw,
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-surface p-4 ring-1 ring-border md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs text-muted">{d.filter.season}</span>
        {seasons.map((s) => (
          <Chip
            key={s}
            label={seasonLabel[s]}
            active={props.season === s}
            onClick={() => props.onSeason(s)}
          />
        ))}
        <span className="ml-3 mr-1 text-xs text-muted">{d.filter.size}</span>
        {props.sizeOptions.map((size) => (
          <Chip
            key={size}
            label={size}
            active={props.sizes.includes(size)}
            onClick={() => props.onSizes(toggle(props.sizes, size))}
          />
        ))}
      </div>
      <SortSelect value={props.sort} onChange={props.onSort} />
    </div>
  );
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const activeCls = "border-sage bg-sage-soft text-foreground";
  const idleCls = "border-border text-muted hover:border-sage";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition-colors ${active ? activeCls : idleCls}`}
    >
      {label}
    </button>
  );
}

function SortSelect({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
}) {
  const { d } = useLocale();
  const options: { key: SortKey; label: string }[] = [
    { key: "recommended", label: d.filter.sortRecommended },
    { key: "new", label: d.filter.sortNew },
    { key: "priceAsc", label: d.filter.sortPriceAsc },
    { key: "priceDesc", label: d.filter.sortPriceDesc },
  ];
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SortKey)}
      aria-label={d.filter.sort}
      className="shrink-0 rounded-full border border-border bg-surface px-4 py-1.5 text-xs text-foreground outline-none focus:border-sage"
    >
      {options.map((o) => (
        <option key={o.key} value={o.key}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
