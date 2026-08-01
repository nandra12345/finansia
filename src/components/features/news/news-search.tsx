"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNewsSearch } from "@/hooks/use-news-search";

interface NewsSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function NewsSearch({
  onSearch,
  placeholder = "Search financial news...",
  className = "",
}: NewsSearchProps) {
  const { searchQuery, handleSearch, clearSearch } =
    useNewsSearch();

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value, onSearch)}
        className="pl-10 pr-10"
      />
      {searchQuery && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearSearch}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
