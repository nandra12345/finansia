export type NewsCategory = "all" | "indonesia" | "global" | "crypto" | "stocks" | "economy";
export type NewsSentiment = "bullish" | "bearish" | "neutral";

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  source: {
    name: string;
    url: string;
  };
  image: string;
  url: string;
  publishedAt: string;
  category: NewsCategory;
  sentiment: NewsSentiment;
  summary: string;
}

export interface GNewsResponse {
  articles: GNewsArticle[];
  totalArticles: number;
}

export interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  image: string;
  url: string;
  source: {
    name: string;
    url: string;
  };
  publishedAt: string;
}

export interface NewsStoreState {
  articles: NewsArticle[];
  bookmarkedArticles: string[];
  isLoading: boolean;
  error: string | null;
  selectedCategory: NewsCategory;
  searchQuery: string;
  
  // Actions
  setArticles: (articles: NewsArticle[]) => void;
  setCategory: (category: NewsCategory) => void;
  setSearchQuery: (query: string) => void;
  toggleBookmark: (articleId: string) => void;
  addBookmark: (articleId: string) => void;
  removeBookmark: (articleId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}
