import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { fetchMultipleCategories, fetchNewsArticles } from "@/lib/news/gnews";
import { newsCache, getCacheKey } from "@/lib/news/cache";
import { getCategoryQuery } from "@/lib/news/categories";

import type { NewsArticle, NewsCategory } from "@/types/news";

export const dynamic = "force-dynamic";
export const revalidate = 1800;

async function requireAuth() {
  const { userId } = await auth();
  if (!userId) return { userId: null, error: "Unauthorized" };
  return { userId, error: null };

}

// Better fallback queries for GNews
const CATEGORY_QUERIES: Record<string, string> = {
  all: "finance OR economy OR business",
  indonesia:
    "Indonesia finance OR Bank Indonesia OR IDX OR rupiah OR ekonomi Indonesia",
  global:
    "global economy OR federal reserve OR inflation OR world finance",
  crypto:
    "bitcoin OR ethereum OR cryptocurrency OR crypto market",
  stocks:
    "stock market OR Nasdaq OR Dow Jones OR S&P 500",
};

function sanitizeSearchInput(input: string | null): string | undefined {
  if (!input) return undefined;
  return input
    .trim()
    .slice(0, 200)
    .replace(/[\u0000-\u001F\u007F]/g, "");
}

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;

    const category = (
      searchParams.get("category") || "all"
    ) as NewsCategory;

    const search = sanitizeSearchInput(searchParams.get("search"));

    const apiKey = process.env.GNEWS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Internal Server Error", articles: [] },
        { status: 500 }
      );
    }

    const cacheKey = getCacheKey(category, search);

    const cachedArticles = newsCache.get(cacheKey) as
      | NewsArticle[]
      | undefined;

    if (cachedArticles) {
      return NextResponse.json({
        success: true,
        cached: true,
        total: cachedArticles.length,
        category,
        articles: cachedArticles,
      });
    }

    let articles: NewsArticle[] = [];

    // SEARCH MODE
    if (search) {
      articles = await fetchNewsArticles(search, apiKey, 30);
    }
    // ALL CATEGORY MODE
    else if (category === "all") {
      articles = await fetchMultipleCategories(
        {
          indonesia: CATEGORY_QUERIES.indonesia,
          global: CATEGORY_QUERIES.global,
          crypto: CATEGORY_QUERIES.crypto,
          stocks: CATEGORY_QUERIES.stocks,
        },
        apiKey
      );
    }
    // SINGLE CATEGORY MODE
    else {
      const query =
        CATEGORY_QUERIES[category] ||
        getCategoryQuery(category) ||
        CATEGORY_QUERIES.all;

      articles = await fetchNewsArticles(query, apiKey, 25);
    }

    if (!Array.isArray(articles)) articles = [];

    newsCache.set(cacheKey, articles, 1800);

    return NextResponse.json({
      success: true,
      cached: false,
      total: articles.length,
      category,
      articles,
    });
  } catch (err) {
    console.error("News API error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error", articles: [] },
      { status: 500 }
    );
  }
}

