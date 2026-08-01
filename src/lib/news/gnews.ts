import type { GNewsArticle, NewsArticle } from "@/types/news";
import { analyzeSentiment } from "./sentiment";
import { generateSummary } from "./formatter";
import { detectArticleCategory } from "./categories";

const GNEWS_API_BASE = "https://gnews.io/api/v4/search";

const FALLBACK_QUERIES: Record<string, string[]> = {
  "indonesia economy": [
    "Indonesia finance",
    "Indonesia business",
    "Bank Indonesia",
    "Indonesian market",
  ],

  "global economy": [
    "global finance",
    "world economy",
    "financial markets",
  ],

  cryptocurrency: [
    "bitcoin",
    "crypto market",
    "ethereum",
  ],

  stocks: [
    "stock market",
    "nasdaq",
    "dow jones",
  ],
};

async function requestGNews(
  query: string,
  apiKey: string,
  limit: number
): Promise<GNewsArticle[]> {
  const params = new URLSearchParams({
    q: query,
    lang: "en",
    max: limit.toString(),
    sortby: "publishedAt",
    apikey: apiKey,
  });

  const url = `${GNEWS_API_BASE}?${params.toString()}`;

  console.log("Fetching GNews:", url);

  const response = await fetch(url, {
    next: {
      revalidate: 1800,
    },
  });

  if (!response.ok) {
    const text = await response.text();

    console.error("GNews failed:", {
      status: response.status,
      statusText: response.statusText,
      body: text,
    });

    return [];
  }

  const data = await response.json();

  return data.articles || [];
}

export async function fetchNewsFromGNews(
  query: string,
  apiKey: string,
  limit: number = 20
): Promise<GNewsArticle[]> {
  let articles = await requestGNews(query, apiKey, limit);

  if (articles.length > 0) {
    return articles;
  }

  const fallbackQueries = FALLBACK_QUERIES[query.toLowerCase()] || [];

  for (const fallback of fallbackQueries) {
    console.log(`Trying fallback query: ${fallback}`);

    articles = await requestGNews(fallback, apiKey, limit);

    if (articles.length > 0) {
      return articles;
    }
  }

  return [];
}

export function transformGNewsArticle(
  article: GNewsArticle,
  index: number
): NewsArticle {
  const category = detectArticleCategory(
    article.title,
    article.description
  );

  const sentiment = analyzeSentiment(
    article.title,
    article.description
  );

  const summary = generateSummary(article.description);

  return {
    id: `${article.url}-${index}`,
    title: article.title,
    description: article.description,
    content: article.content,
    source: article.source,
    image: article.image || "/placeholder-news.png",
    url: article.url,
    publishedAt: article.publishedAt,
    category,
    sentiment,
    summary,
  };
}

export async function fetchNewsArticles(
  query: string,
  apiKey: string,
  limit: number = 20
): Promise<NewsArticle[]> {
  try {
    const articles = await fetchNewsFromGNews(
      query,
      apiKey,
      limit
    );

    return articles.map((article, index) =>
      transformGNewsArticle(article, index)
    );
  } catch (error) {
    console.error("Failed to fetch news articles:", error);

    return [];
  }
}

export async function fetchMultipleCategories(
  queries: Record<string, string>,
  apiKey: string
): Promise<NewsArticle[]> {
  try {
    const results = await Promise.all(
      Object.entries(queries).map(async ([_, query]) => {
        return await fetchNewsArticles(query, apiKey, 15);
      })
    );

    const allArticles = results.flat();

    const uniqueArticles = Array.from(
      new Map(
        allArticles.map((item) => [item.url, item])
      ).values()
    );

    return uniqueArticles.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() -
        new Date(a.publishedAt).getTime()
    );
  } catch (error) {
    console.error(
      "Failed to fetch multiple categories:",
      error
    );

    return [];
  }
}