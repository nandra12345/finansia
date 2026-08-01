import type { NewsCategory } from "@/types/news";

export interface NewsQuery {
  category: NewsCategory;
  query: string;
  description: string;
}

export const NEWS_CATEGORIES: Record<NewsCategory, NewsQuery> = {
  all: {
    category: "all",
    query: "financial news OR economy OR market",
    description: "All Financial News",
  },
  indonesia: {
    category: "indonesia",
    query: "ekonomi indonesia OR rupiah OR bank indonesia OR IHSG OR BCA OR mandiri",
    description: "Indonesian Economy",
  },
  global: {
    category: "global",
    query: "global economy OR inflation OR federal reserve OR world market OR ECB OR economic news",
    description: "Global Economy",
  },
  crypto: {
    category: "crypto",
    query: "bitcoin OR ethereum OR crypto market OR cryptocurrency OR blockchain OR Web3",
    description: "Cryptocurrency",
  },
  stocks: {
    category: "stocks",
    query: "stock market OR nasdaq OR dow jones OR saham OR S&P 500 OR trading",
    description: "Stock Market",
  },
  economy: {
    category: "economy",
    query: "economic data OR GDP OR unemployment OR interest rates OR monetary policy",
    description: "Economics",
  },
};

export function getCategoryLabel(category: NewsCategory): string {
  return NEWS_CATEGORIES[category].description;
}

export function getCategoryQuery(category: NewsCategory): string {
  return NEWS_CATEGORIES[category].query;
}

export function isCategoryMatch(
  articleText: string,
  categories: NewsCategory[]
): boolean {
  const text = articleText.toLowerCase();

  for (const category of categories) {
    const query = getCategoryQuery(category).toLowerCase();
    const keywords = query.split(" OR ");

    for (const keyword of keywords) {
      if (text.includes(keyword.trim())) {
        return true;
      }
    }
  }

  return false;
}

export function detectArticleCategory(
  title: string,
  description: string
): NewsCategory {
  const text = `${title} ${description}`.toLowerCase();

  // Check in order of specificity
  if (
    text.includes("indonesia") ||
    text.includes("rupiah") ||
    text.includes("bank indonesia") ||
    text.includes("ihsg")
  ) {
    return "indonesia";
  }

  if (
    text.includes("bitcoin") ||
    text.includes("ethereum") ||
    text.includes("crypto") ||
    text.includes("blockchain") ||
    text.includes("nft")
  ) {
    return "crypto";
  }

  if (
    text.includes("nasdaq") ||
    text.includes("dow jones") ||
    text.includes("s&p 500") ||
    text.includes("stock")
  ) {
    return "stocks";
  }

  if (
    text.includes("federal reserve") ||
    text.includes("ecb") ||
    text.includes("gdp") ||
    text.includes("unemployment") ||
    text.includes("interest rate")
  ) {
    return "economy";
  }

  if (text.includes("global") || text.includes("world")) {
    return "global";
  }

  return "all";
}
