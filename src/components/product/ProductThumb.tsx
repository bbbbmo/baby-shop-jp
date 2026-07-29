import type { CategorySlug } from "@/lib/types";

type Props = {
  category: CategorySlug;
  color: string;
  className?: string;
};

const EMOJI_BY_TYPE: Record<string, string> = {
  top: "🎽",
  setup: "🧸",
  bottom: "🩳",
  dress: "👗",
  homewear: "🌿",
  swimwear: "🏊",
};

const EMOJI_BY_LEAF: Record<string, string> = {
  mom: "👚",
  accessory: "🧦",
  gift: "🎁",
};

const emojiFor = (category: CategorySlug): string => {
  if (category in EMOJI_BY_LEAF) {
    return EMOJI_BY_LEAF[category];
  }
  const [, typeKey] = category.split("-");
  return EMOJI_BY_TYPE[typeKey] ?? "🧸";
};

/**
 * Lightweight placeholder "image": a soft pastel gradient tinted by the
 * product's main color, with a type-based emoji as a focal point.
 */
export function ProductThumb({ category, color, className = "" }: Props) {
  const emoji = emojiFor(category);
  const style = {
    backgroundImage: `radial-gradient(circle at 30% 25%, #ffffff 0%, ${color} 70%, ${color} 100%)`,
  };
  return (
    <div
      className={`flex items-center justify-center overflow-hidden ${className}`}
      style={style}
      aria-hidden
    >
      <span className="text-5xl opacity-80 drop-shadow-sm select-none">
        {emoji}
      </span>
    </div>
  );
}
