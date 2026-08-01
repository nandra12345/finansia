"use client";

import { Button } from "@/components/ui/button";
import { getCategoryLabel } from "@/lib/news/categories";
import type { NewsCategory } from "@/types/news";

interface NewsTabsProps {
  categories: readonly NewsCategory[];
  selectedCategory: NewsCategory;
  onCategoryChange: (category: NewsCategory) => void;
  isLoading?: boolean;
}

export function NewsTabs({
  categories,
  selectedCategory,
  onCategoryChange,
  isLoading = false,
}: NewsTabsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {categories.map((category) => (
        <Button
          key={category}
          variant={selectedCategory === category ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange(category)}
          disabled={isLoading}
          className="whitespace-nowrap"
        >
          {getCategoryLabel(category)}
        </Button>
      ))}
    </div>
  );
}