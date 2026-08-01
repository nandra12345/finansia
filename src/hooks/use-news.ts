"use client";

import { useEffect, useCallback } from "react";
import { useNewsStore } from "@/store/use-news-store";
import type { NewsCategory, NewsArticle } from "@/types/news";

export function useNews() {
  const {
    articles,
    isLoading,
    error,
    selectedCategory,
    searchQuery,
    setArticles,
    setLoading,
    setError,
    setCategory,
    setSearchQuery,
    toggleBookmark,
  } = useNewsStore();

  const fetchNews = useCallback(
    async (category: NewsCategory = selectedCategory, search?: string) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.append("category", category);
        if (search) {
          params.append("search", search);
        }

        const response = await fetch(`/api/news?${params.toString()}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch news");
        }

        const data = await response.json();
        setArticles(data.articles || []);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch news";
        setError(errorMessage);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    },
    [selectedCategory, setArticles, setLoading, setError]
  );

  const handleCategoryChange = useCallback(
    (category: NewsCategory) => {
      setCategory(category);
      fetchNews(category);
    },
    [setCategory, fetchNews]
  );

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (query.trim()) {
        fetchNews(selectedCategory, query);
      } else {
        fetchNews(selectedCategory);
      }
    },
    [selectedCategory, setSearchQuery, fetchNews]
  );

  return {
    articles,
    isLoading,
    error,
    selectedCategory,
    searchQuery,
    fetchNews,
    handleCategoryChange,
    handleSearch,
    toggleBookmark,
  };
}

export function useFilteredNews() {
  const { articles, searchQuery, selectedCategory } = useNewsStore();

  const filteredArticles = articles.filter((article) => {
    const matchesCategory =
      selectedCategory === "all" || article.category === selectedCategory;

    const matchesSearch = !searchQuery
      ? true
      : article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return filteredArticles;
}

export function useBookmarkedArticles() {
  const { articles, bookmarkedArticles } = useNewsStore();

  return articles.filter((article) =>
    bookmarkedArticles.includes(article.id)
  );
}
