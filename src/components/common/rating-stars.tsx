"use client";

import { useState } from "react";
import type { MouseEvent } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type RatingStarsProps = {
  rating: number;
  onChange?: (rating: number) => void;
  allowHalf?: boolean;
  className?: string;
  starClassName?: string;
};

function starFill(value: number, star: number, allowHalf: boolean) {
  const normalized = allowHalf ? Math.round(value * 2) / 2 : Math.round(value);
  if (normalized >= star) return "full";
  if (allowHalf && normalized >= star - 0.5) return "half";
  return "empty";
}

function StarCell({
  fill,
  starClassName,
}: {
  fill: "full" | "half" | "empty";
  starClassName?: string;
}) {
  const base = "absolute inset-0";
  return (
    <span className="relative inline-flex h-4 w-4 shrink-0">
      <Star className={cn(base, "text-muted-foreground", starClassName)} />
      {fill !== "empty" && (
        <Star
          className={cn(base, "fill-amber-400 text-amber-400", starClassName)}
          style={fill === "half" ? { clipPath: "inset(0 50% 0 0)" } : undefined}
        />
      )}
    </span>
  );
}

export function RatingStars({
  rating,
  onChange,
  allowHalf = true,
  className,
  starClassName,
}: RatingStarsProps) {
  const [hover, setHover] = useState(0);
  const activeRating = hover || rating;

  const handlePointer = (
    event: MouseEvent<HTMLButtonElement>,
    star: number,
  ) => {
    if (!onChange) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const isHalf = allowHalf && event.clientX - rect.left < rect.width / 2;
    onChange(isHalf ? star - 0.5 : star);
  };

  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {Array.from({ length: 5 }).map((_, index) => {
        const star = index + 1;
        const fill = starFill(activeRating, star, allowHalf);
        const interactive = !!onChange;

        return interactive ? (
          <button
            key={star}
            type="button"
            onClick={(event) => handlePointer(event, star)}
            onMouseMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const isHalf = allowHalf && event.clientX - rect.left < rect.width / 2;
              setHover(isHalf ? star - 0.5 : star);
            }}
            onMouseLeave={() => setHover(0)}
            className="p-0.5"
          >
            <StarCell fill={fill} starClassName={starClassName} />
          </button>
        ) : (
          <span key={star} className="p-0.5">
            <StarCell fill={fill} starClassName={starClassName} />
          </span>
        );
      })}
    </div>
  );
}
