import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  NewsArticle,
  NewsCategory,
  NewsStoreState,
} from "@/types/news";

export const useNewsStore = create<NewsStoreState>()(
  persist(
    (set, get) => ({
      articles: [],
      bookmarkedArticles: [],
      isLoading: false,
      error: null,
      selectedCategory: "all",
      searchQuery: "",

      setArticles: (articles) => set({ articles }),
      setCategory: (category: NewsCategory) =>
        set({ selectedCategory: category }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      toggleBookmark: (articleId) => {
        const currentIds = get().bookmarkedArticles;
        const isBookmarked = currentIds.includes(articleId);

        set({
          bookmarkedArticles: isBookmarked
            ? currentIds.filter((id) => id !== articleId)
            : [...currentIds, articleId],
        });
      },
      addBookmark: (articleId) =>
        set((state) =>
          state.bookmarkedArticles.includes(articleId)
            ? state
            : {
                bookmarkedArticles: [
                  ...state.bookmarkedArticles,
                  articleId,
                ],
              }
        ),
      removeBookmark: (articleId) =>
        set((state) => ({
          bookmarkedArticles: state.bookmarkedArticles.filter(
            (id) => id !== articleId
          ),
        })),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      reset: () =>
        set({
          articles: [],
          bookmarkedArticles: [],
          isLoading: false,
          error: null,
          selectedCategory: "all",
          searchQuery: "",
        }),
    }),
    {
      name: "finansia-news-store",
      partialize: (state) => ({
        bookmarkedArticles: state.bookmarkedArticles,
      }),
    }
  )
);