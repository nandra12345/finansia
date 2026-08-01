"use client";

import { NewsCard } from "./news-card";
import { Card, CardContent } from "@/components/ui/card";
import type { NewsArticle } from "@/types/news";

interface NewsGridProps {
  articles: NewsArticle[];
  layout?: "vertical" | "horizontal" | "compact";
  emptyMessage?: string;
}

export function NewsGrid({
  articles,
  layout = "vertical",
  emptyMessage = "No articles found. Try adjusting your search or category.",
}: NewsGridProps) {
  if (articles.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  const gridClassNames =
    layout === "vertical"
      ? "grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      : layout === "horizontal"
        ? "space-y-3"
        : "space-y-2";

  return (
    <div className={gridClassNames}>
      {articles.map((article) => (
        <NewsCard
          key={article.id}
          article={article}
          layout={layout}
        />
      ))}
    </div>
  );
}
