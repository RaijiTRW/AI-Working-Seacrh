/**
 * SEO Helper Functions
 * Additional utilities for SEO optimization
 */

import { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobaisearch.ru";

/**
 * Generate absolute URL from a path (with security validation)
 */
export function absoluteUrl(path: string): string {
  // Validate path doesn't contain protocol or suspicious characters
  if (/[<>"'\\]/.test(path)) {
    return siteUrl;
  }

  const sanitizedPath = path.startsWith("/") ? path : `/${path}`;

  // Prevent double slashes and path traversal
  const normalizedPath = sanitizedPath.replace(/\/+/g, '/').replace(/\.\./g, '');

  return `${siteUrl}${normalizedPath}`;
}

/**
 * Generate canonical URL
 */
export function canonicalUrl(path: string): string {
  return absoluteUrl(path);
}

/**
 * Generate meta description with fallback
 */
export function generateMetaDescription(
  text: string | undefined | null,
  fallback: string,
  maxLength = 160
): string {
  if (!text) return fallback;

  const truncated = text.length > maxLength ? text.slice(0, maxLength - 3).trim() + "..." : text;
  return truncated || fallback;
}

/**
 * Generate title with site name suffix
 */
export function generateTitle(title: string, includeSiteName = true): string {
  return includeSiteName ? `${title} | JobAISearch` : title;
}

/**
 * Generate OpenGraph images array
 */
export function generateOpenGraphImages(
  imageUrl: string,
  width = 1200,
  height = 630,
  alt?: string
): Array<{ url: string; width: number; height: number; alt: string }> {
  return [
    {
      url: imageUrl,
      width,
      height,
      alt: alt || "JobAISearch",
    },
  ];
}

/**
 * Generate structured data for AggregateRating
 */
export function generateAggregateRatingJsonLd(params: {
  itemName: string;
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
}) {
  const { itemName, ratingValue, reviewCount, bestRating = 5, worstRating = 1 } = params;

  return {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    itemName,
    ratingValue,
    reviewCount,
    bestRating,
    worstRating,
  };
}

/**
 * Generate structured data for Organization
 */
export function generateOrganizationJsonLd(params: {
  name: string;
  url?: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
}) {
  const { name, url = siteUrl, logo, description, sameAs = [] } = params;

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    ...(logo && { logo: absoluteUrl(logo) }),
    ...(description && { description }),
    ...(sameAs.length > 0 && { sameAs }),
  };
}

/**
 * Generate structured data for WebSite
 */
export function generateWebSiteJsonLd(params?: {
  name?: string;
  url?: string;
  description?: string;
}) {
  const { name = "JobAISearch", url = siteUrl, description } = params || {};

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
    ...(description && { description }),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/vacancies?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Generate structured data for VideoObject
 */
export function generateVideoJsonLd(params: {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string;
  embedUrl?: string;
}) {
  const { name, description, thumbnailUrl, uploadDate, duration, embedUrl } = params;

  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name,
    description,
    thumbnailUrl: absoluteUrl(thumbnailUrl),
    uploadDate,
    ...(duration && { duration }),
    ...(embedUrl && { embedUrl: absoluteUrl(embedUrl) }),
  };
}

/**
 * Generate noindex metadata
 */
export function noIndexMetadata(): Metadata {
  return {
    robots: {
      index: false,
      follow: false,
    },
  };
}

/**
 * Generate metadata for pagination
 */
export function generatePaginationMetadata(params: {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}): { alternates?: { previous?: string; next?: string } } {
  const { currentPage, totalPages, baseUrl } = params;

  const metadata: { alternates?: { previous?: string; next?: string } } = {};

  if (currentPage > 1) {
    metadata.alternates = {
      ...metadata.alternates,
      previous: absoluteUrl(`${baseUrl}?page=${currentPage - 1}`),
    };
  }

  if (currentPage < totalPages) {
    metadata.alternates = {
      ...metadata.alternates,
      next: absoluteUrl(`${baseUrl}?page=${currentPage + 1}`),
    };
  }

  return metadata;
}

/**
 * Clean and sanitize text for meta tags
 */
export function sanitizeMetaText(text: string): string {
  return text
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim();
}

/**
 * Extract keywords from text
 */
export function extractKeywords(text: string, maxKeywords = 10): string[] {
  // Remove common words and extract potential keywords
  const stopWords = new Set([
    "и",
    "в",
    "во",
    "не",
    "что",
    "он",
    "на",
    "с",
    "как",
    "а",
    "то",
    "все",
    "она",
    "так",
    "его",
    "из",
    "этом",
    "для",
    "мы",
    "вы",
    "по",
    "или",
    "но",
    "к",
    "у",
    "же",
    "бы",
    "это",
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\sа-яА-ЯёЁ]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word));

  // Count word frequency
  const wordFreq = new Map<string, number>();
  words.forEach((word) => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });

  // Sort by frequency and return top keywords
  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

/**
 * Generate meta keywords from content
 */
export function generateMetaKeywords(
  title: string,
  description?: string,
  additionalKeywords: string[] = []
): string[] {
  const keywords = new Set<string>();

  // Add title words
  extractKeywords(title).forEach((kw) => keywords.add(kw));

  // Add description keywords
  if (description) {
    extractKeywords(description).forEach((kw) => keywords.add(kw));
  }

  // Add additional keywords
  additionalKeywords.forEach((kw) => keywords.add(kw));

  return Array.from(keywords);
}
