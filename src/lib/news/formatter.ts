export function generateSummary(description: string): string {
  if (!description) return "No summary available";

  // Clean up the text
  let summary = description
    .replace(/\.\.\./g, ".")
    .replace(/\s+/g, " ")
    .trim();

  // If it's short enough, return as-is
  if (summary.length <= 150) {
    return summary;
  }

  // Find a natural break point (sentence ending)
  const sentences = summary.split(/(?<=[.!?])\s+/);
  let result = "";

  for (const sentence of sentences) {
    if ((result + sentence).length <= 150) {
      result += (result ? " " : "") + sentence;
    } else {
      break;
    }
  }

  // Ensure it ends with a period if it doesn't already
  if (result && !result.endsWith(".")) {
    result += ".";
  }

  return result || summary.substring(0, 150) + "...";
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength).trim() + "...";
}

export function formatSourceName(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace("www.", "").split(".")[0];
  } catch {
    return "News";
  }
}

export function isRecentNews(publishedAt: string): boolean {
  const published = new Date(publishedAt);
  const now = new Date();
  const hoursAgo = (now.getTime() - published.getTime()) / (1000 * 60 * 60);
  return hoursAgo < 24;
}

export function formatRelativeTime(dateString: string): string {
  const published = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - published.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return published.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
