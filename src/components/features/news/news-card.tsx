"use client";

import { ExternalLink, Globe } from "lucide-react";

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

// Removed local bookmark store access; BookmarkButton handles bookmark toggling.

import type { NewsArticle } from "@/types/news";

interface NewsCardProps {
  article: NewsArticle;
  layout?: "vertical" | "horizontal" | "compact";
}

export function NewsCard({
  article,
  layout = "vertical",
}: NewsCardProps) {

  const handleCardClick = () => {
    window.open(article.url, "_blank", "noopener,noreferrer");
  };

  const isRecent = isRecentNews(article.publishedAt);

  if (layout === "horizontal") {
    return (
      <Card
        className="cursor-pointer transition-shadow hover:shadow-md"
        onClick={handleCardClick}
      >
        <CardContent className="flex gap-4 p-4">
          {article.image && (
            <img
              src={article.image}
              alt={article.title}
              className="h-24 w-24 flex-shrink-0 rounded-lg object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "/placeholder-news.png";
              }}
            />
          )}

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 text-sm font-semibold">
                {article.title}
              </h3>

              <BookmarkButton article={article} size="sm" />
            </div>

            <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
              {article.summary}
            </p>

            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>{formatSourceName(article.source.url)}</span>
                <span>•</span>
                <span>{formatRelativeTime(article.publishedAt)}</span>

                {isRecent && (
                  <span className="text-amber-500">•</span>
                )}
              </div>

              <SentimentBadge
                sentiment={article.sentiment}
                size="sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (layout === "compact") {
    return (
      <Card
        className="cursor-pointer transition-shadow hover:shadow-md"
        onClick={handleCardClick}
      >
        <CardContent className="p-3">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h4 className="line-clamp-2 flex-1 text-sm font-medium">
              {article.title}
            </h4>

            <BookmarkButton article={article} size="sm" />
          </div>

          <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="truncate">
                {formatSourceName(article.source.url)}
              </span>

              <span>•</span>

              <span className="flex-shrink-0">
                {formatRelativeTime(article.publishedAt)}
              </span>
            </div>
          </div>

          <SentimentBadge
            sentiment={article.sentiment}
            size="sm"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-lg"
      onClick={handleCardClick}
    >
      <CardContent className="p-0">
        {article.image && (
          <div className="relative h-48 overflow-hidden bg-muted">
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
              <Badge className="absolute right-2 top-2 bg-amber-500">
                BREAKING
              </Badge>
            )}
          </div>
        )}

        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="secondary" className="text-xs">
              {article.category.charAt(0).toUpperCase() +
                article.category.slice(1)}
            </Badge>

            <SentimentBadge
              sentiment={article.sentiment}
              size="sm"
            />
          </div>

          <h3 className="line-clamp-2 text-base font-semibold leading-snug">
            {article.title}
          </h3>

          <p className="line-clamp-2 text-sm text-muted-foreground">
            {article.summary}
          </p>

          <div className="flex items-center justify-between gap-2 pt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Globe className="h-3 w-3" />

              <span>
                {formatSourceName(article.source.url)}
              </span>

              <span>•</span>

              <span>
                {formatRelativeTime(article.publishedAt)}
              </span>
            </div>

            <BookmarkButton article={article} size="sm" />
          </div>

          <div className="flex items-center justify-end pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Read More
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}