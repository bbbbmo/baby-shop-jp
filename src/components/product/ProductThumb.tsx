import { getCategory } from "@/lib/categories";
import type { CategorySlug } from "@/lib/types";

type Props = {
  category: CategorySlug;
  color: string;
  className?: string;
};

/**
 * Lightweight placeholder "image": a soft pastel gradient tinted by the
 * product's main color, with the category emoji as a focal point.
 */
export function ProductThumb({ category, color, className = "" }: Props) {
  const emoji = getCategory(category)?.emoji ?? "🧸";
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
