"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SentimentBadge } from "./sentiment-badge";
import { BookmarkButton } from "./bookmark-button";
import {
  formatRelativeTime,
  formatSourceName,
  isRecentNews,
} from "@/lib/news/formatter";
import type { NewsArticle } from "@/types/news";

interface HeroHeadlineProps {
  article: NewsArticle | null;
  isLoading?: boolean;
}

export function HeroHeadline({
  article,
  isLoading = false,
}: HeroHeadlineProps) {
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="aspect-video animate-pulse bg-muted" />

          <div className="space-y-4 p-6">
            <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!article) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          No headline available
        </CardContent>
      </Card>
    );
  }

  const isRecent = isRecentNews(article.publishedAt);

  const handleClick = () => {
    window.open(article.url, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
      <CardContent className="p-0">
        {/* IMAGE */}
        {article.image && (
          <div
            className="relative h-80 overflow-hidden bg-muted"
            onClick={handleClick}
          >
            <img
              src={article.image}
              alt={article.title}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "/placeholder-news.png";
              }}
            />

            {isRecent && (
              <Badge className="absolute left-4 top-4 bg-amber-500 text-white">
                BREAKING NEWS
              </Badge>
            )}
          </div>
        )}

        {/* CONTENT */}
        <div className="space-y-4 p-6">
          {/* CATEGORY + SENTIMENT */}
          <div className="flex items-center justify-between gap-2">
            <Badge variant="secondary">
              {article.category.charAt(0).toUpperCase() +
                article.category.slice(1)}
            </Badge>

            <SentimentBadge sentiment={article.sentiment} />
          </div>

          {/* TITLE */}
          <h1
            onClick={handleClick}
            className="cursor-pointer text-2xl font-bold leading-tight hover:opacity-80 md:text-3xl"
          >
            {article.title}
          </h1>

          {/* SUMMARY */}
          <p
            onClick={handleClick}
            className="line-clamp-3 cursor-pointer text-base text-muted-foreground"
          >
            {article.summary}
          </p>

          {/* FOOTER */}
          <div className="flex items-center justify-between gap-4 border-t pt-4">
            <div className="text-sm text-muted-foreground">
              <p>
                <span className="font-medium">
                  {formatSourceName(article.source.url)}
                </span>

                {" • "}

                <span>
                  {formatRelativeTime(article.publishedAt)}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* FIXED */}
              <BookmarkButton
                article={article}
                variant="ghost"
                size="sm"
              />

              <Button
                variant="default"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
              >
                Read Full Story
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}