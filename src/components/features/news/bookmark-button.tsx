"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useNewsStore } from "@/store/use-news-store";
import type { NewsArticle } from "@/types/news";

interface BookmarkButtonProps {
  article: NewsArticle;

  variant?:
    | "default"
    | "outline"
    | "ghost"
    | "secondary"
    | "destructive"
    | "link";

  size?:
    | "default"
    | "xs"
    | "sm"
    | "lg"
    | "icon"
    | "icon-xs"
    | "icon-sm"
    | "icon-lg";
}

export function BookmarkButton({
  article,
  variant = "ghost",
  size = "icon-sm",
}: BookmarkButtonProps) {
  const bookmarkedArticles = useNewsStore(
    (state) => state.bookmarkedArticles
  );

  const toggleBookmark = useNewsStore(
    (state) => state.toggleBookmark
  );

  const isBookmarked = bookmarkedArticles.includes(article.id);

  const handleToggle = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    toggleBookmark(article.id);
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleToggle}
    >
      {isBookmarked ? (
        <BookmarkCheck className="h-4 w-4" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
    </Button>
  );
}