"use client";

import { useEffect, useMemo } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { HeroHeadline } from "@/components/features/news/hero-headline";
import { NewsGrid } from "@/components/features/news/news-grid";
import { NewsTabs } from "@/components/features/news/news-tabs";
import { NewsSearch } from "@/components/features/news/news-search";
import { NewsSkeleton } from "@/components/features/news/news-skeleton";
import { useNews, useFilteredNews } from "@/hooks/use-news";

const NEWS_CATEGORIES = ["all", "indonesia", "global", "crypto", "stocks", "economy"] as const;

export default function NewsPage() {
  const { articles, isLoading, error, selectedCategory, fetchNews, handleCategoryChange, handleSearch } =
    useNews();

  const filteredArticles = useFilteredNews();

  // Fetch news on mount
  useEffect(() => {
    fetchNews();
  }, []);

  const heroArticle = useMemo(() => {
    return filteredArticles.length > 0 ? filteredArticles[0] : null;
  }, [filteredArticles]);

  const gridArticles = useMemo(() => {
    return filteredArticles.slice(1);
  }, [filteredArticles]);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial News</h1>
        <p className="text-muted-foreground mt-1">
          Stay updated with the latest financial market news and economic insights
        </p>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="max-w-md">
        <NewsSearch onSearch={handleSearch} />
      </div>

      {/* Category Tabs */}
      <div className="overflow-x-auto">
        <NewsTabs
          categories={NEWS_CATEGORIES}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          isLoading={isLoading}
        />
      </div>

      {/* Loading State */}
      {isLoading ? (
        <NewsSkeleton count={6} />
      ) : (
        <>
          {/* Hero Headline */}
          <div>
            <HeroHeadline article={heroArticle} />
          </div>

          {/* Articles Grid */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Latest Articles</h2>
            <NewsGrid
              articles={gridArticles}
              layout="vertical"
              emptyMessage="No articles found. Try a different category or search term."
            />
          </div>
        </>
      )}
    </div>
  );
}
