import { StarIcon } from "@/components/ui/icons";

export function RatingStars({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon
          key={i}
          className={`h-3.5 w-3.5 ${i < rounded ? "text-blush" : "text-border"}`}
        />
      ))}
    </span>
  );
}
