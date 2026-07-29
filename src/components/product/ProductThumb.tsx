import type { CategorySlug, ClothingType } from "@/lib/types";

type Props = {
  category: CategorySlug;
  color: string;
  className?: string;
};

const EMOJI_BY_TYPE: Record<ClothingType, string> = {
  top: "🎽",
  setup: "🧸",
  bottom: "🩳",
  dress: "👗",
  homewear: "🌿",
  swimwear: "🏊",
};

const EMOJI_BY_LEAF: Record<"mom" | "accessory" | "gift", string> = {
  mom: "👚",
  accessory: "🧦",
  gift: "🎁",
};

const emojiFor = (category: CategorySlug): string => {
  if (Object.hasOwn(EMOJI_BY_LEAF, category)) {
    return EMOJI_BY_LEAF[category as "mom" | "accessory" | "gift"];
  }
  const [, typeKey] = category.split("-");
  return EMOJI_BY_TYPE[typeKey as ClothingType] ?? "🧸";
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
