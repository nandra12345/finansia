"use client";

import { Badge } from "@/components/ui/badge";
import { getSentimentColor, getSentimentLabel } from "@/lib/news/sentiment";
import type { NewsSentiment } from "@/types/news";

interface SentimentBadgeProps {
  sentiment: NewsSentiment;
  size?: "sm" | "md";
}

export function SentimentBadge({ sentiment, size = "sm" }: SentimentBadgeProps) {
  const color = getSentimentColor(sentiment);
  const label = getSentimentLabel(sentiment);

  return (
    <Badge className={`${color} ${size === "sm" ? "text-xs" : "text-sm"}`}>
      {label}
    </Badge>
  );
}
