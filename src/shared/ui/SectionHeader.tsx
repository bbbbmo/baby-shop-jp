import { MarketLink } from "@/shared/market";

type Props = {
  title: string;
  subtitle?: string;
  moreHref?: string;
  moreLabel?: string;
};

export function SectionHeader({ title, subtitle, moreHref, moreLabel }: Props) {
  return (
    <div className="mb-6 flex items-end justify-between">
      <div>
        <h2 className="text-xl font-bold text-foreground md:text-2xl">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {moreHref && (
        <MarketLink
          href={moreHref}
          className="shrink-0 text-sm text-muted underline-offset-4 hover:text-sage hover:underline"
        >
          {moreLabel ?? "more +"}
        </MarketLink>
      )}
    </div>
  );
}
