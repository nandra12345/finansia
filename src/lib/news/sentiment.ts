import type { NewsSentiment } from "@/types/news";

const BULLISH_KEYWORDS = [
  "rally",
  "surge",
  "gains",
  "growth",
  "rises",
  "soars",
  "boost",
  "outperform",
  "strong",
  "bullish",
  "positive",
  "upbeat",
  "record",
  "bull market",
  "rally continues",
  "recovery",
  "rebound",
  "upgrade",
  "beat expectations",
];

const BEARISH_KEYWORDS = [
  "crash",
  "plunge",
  "decline",
  "slump",
  "recession",
  "inflation fears",
  "bearish",
  "losses",
  "downside",
  "weakness",
  "sell-off",
  "downturn",
  "downgrade",
  "miss expectations",
  "bear market",
  "risk",
  "threatened",
  "collapse",
  "concern",
];

export function analyzeSentiment(
  title: string,
  description: string
): NewsSentiment {
  const text = `${title} ${description}`.toLowerCase();

  let bullishScore = 0;
  let bearishScore = 0;

  BULLISH_KEYWORDS.forEach((keyword) => {
    if (text.includes(keyword)) {
      bullishScore += 1;
    }
  });

  BEARISH_KEYWORDS.forEach((keyword) => {
    if (text.includes(keyword)) {
      bearishScore += 1;
    }
  });

  if (bullishScore > bearishScore) {
    return "bullish";
  } else if (bearishScore > bullishScore) {
    return "bearish";
  }

  return "neutral";
}

export function getSentimentColor(sentiment: NewsSentiment): string {
  switch (sentiment) {
    case "bullish":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "bearish":
      return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400";
    case "neutral":
      return "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400";
  }
}

export function getSentimentLabel(sentiment: NewsSentiment): string {
  switch (sentiment) {
    case "bullish":
      return "Bullish";
    case "bearish":
      return "Bearish";
    case "neutral":
      return "Neutral";
  }
}
