"use client";

import type { Card } from "@/domain/types";

interface CardCornerProps {
  rank: Card["rank"];
  suitSymbol: string;
  toneClassName: string;
  position: "top-left" | "bottom-right";
}

const positionClassNames: Record<CardCornerProps["position"], string> = {
  "top-left": "left-3 top-3 items-start text-left",
  "bottom-right": "bottom-3 right-3 rotate-180 items-start text-left",
};

export function CardCorner({
  rank,
  suitSymbol,
  toneClassName,
  position,
}: CardCornerProps) {
  return (
    <div
      className={`absolute flex flex-col leading-none ${positionClassNames[position]} ${toneClassName}`}
    >
      <span className="text-sm font-bold tablet:text-base">{rank}</span>
      <span className="-mt-0.5 text-base tablet:text-lg">{suitSymbol}</span>
    </div>
  );
}
