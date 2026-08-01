"use client";

import { useCallback, useState, useRef } from "react";

export function useNewsSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback(
    (query: string, onSearch: (query: string) => Promise<void> | void) => {
      setSearchQuery(query);

      // Clear previous timeout
      if (debounceTimer.current !== null) {
        clearTimeout(debounceTimer.current);
      }

      // Set new timeout for debounced search
      if (query.trim()) {
        setIsSearching(true);
        debounceTimer.current = setTimeout(async () => {
          try {
            await onSearch(query);
          } finally {
            setIsSearching(false);
          }
        }, 500); // 500ms debounce
      } else {
        setIsSearching(false);
        onSearch("");
      }
    },
    []
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
      if (debounceTimer.current !== null) {
      clearTimeout(debounceTimer.current);
    }
  }, []);

  return {
    searchQuery,
    isSearching,
    handleSearch,
    clearSearch,
  };
}
