"use client";

import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SentimentBadge } from "./sentiment-badge";
import { formatRelativeTime, formatSourceName } from "@/lib/news/formatter";
import type { NewsArticle } from "@/types/news";

interface NewsNotificationsProps {
  articles: NewsArticle[];
  maxItems?: number;
  onArticleClick?: (article: NewsArticle) => void;
}

export function NewsNotifications({
  articles,
  maxItems = 8,
  onArticleClick,
}: NewsNotificationsProps) {
  const topArticles = articles.slice(0, maxItems);

  if (topArticles.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        No news updates available
      </div>
    );
  }

  return (
    <ScrollArea className="h-auto max-h-96">
      <div className="space-y-3 p-4">
        {topArticles.map((article) => (
          <div
            key={article.id}
            className="group p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
            onClick={() => {
              window.open(article.url, "_blank", "noopener,noreferrer");
              onArticleClick?.(article);
            }}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-medium text-sm line-clamp-2 flex-1 group-hover:text-primary">
                {article.title}
              </h4>
              <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-1" />
            </div>

            <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
              {article.summary}
            </p>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatSourceName(article.source.url)}</span>
                <span>•</span>
                <span>{formatRelativeTime(article.publishedAt)}</span>
              </div>
              <SentimentBadge sentiment={article.sentiment} size="sm" />
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
