import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarRatingProps = {
  rating: number;
  max?: number;
  size?: "sm" | "md";
  showValue?: boolean;
  className?: string;
};

export default function StarRating({
  rating,
  max = 5,
  size = "md",
  showValue = false,
  className,
}: StarRatingProps) {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {Array.from({ length: max }).map((_, index) => {
          const filled = rating >= index + 1;
          const partial = !filled && rating > index && rating < index + 1;

          return (
            <Star
              key={index}
              className={cn(
                iconSize,
                filled || partial
                  ? "fill-amber-400 text-amber-400"
                  : "fill-gray-200 text-gray-200",
              )}
            />
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm font-semibold text-gray-900">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
