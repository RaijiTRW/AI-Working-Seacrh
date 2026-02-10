import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sanitizeString } from "@/lib/sanitize";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobaisearch.ru";

// Security: Maximum items and query length
const MAX_ITEMS = 50;
const MAX_QUERY_LENGTH = 100;

/**
 * Escape special XML characters
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Format date for RSS (RFC 822)
 */
function formatRSSDate(date: string | Date): string {
  return new Date(date).toUTCString();
}

/**
 * Truncate text to specific length
 */
function truncateText(text: string, maxLength: number): string {
  const cleanText = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (cleanText.length <= maxLength) return cleanText;
  return cleanText.slice(0, maxLength - 3).trim() + "...";
}

/**
 * Get source label
 */
function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    hh: "hh.ru",
    avito: "Avito",
    superjob: "SuperJob",
    platform: "JobAISearch",
  };
  return labels[source] || source;
}

/**
 * Fetch platform vacancies
 */
async function getPlatformVacancies(
  supabase: any,
  filters: {
    query?: string;
    city?: string;
    experience?: string;
  }
): Promise<any[]> {
  let query = supabase
    .from("employer_vacancies")
    .select("*")
    .eq("status", "published")
    .eq("is_active", true)
    .eq("is_public", true);

  if (filters.query) {
    query = query.or(
      `title.ilike.%${filters.query}%,description.ilike.%${filters.query}%,company.ilike.%${filters.query}%`
    );
  }

  if (filters.city) {
    query = query.ilike("city", `%${filters.city}%`);
  }

  if (filters.experience) {
    if (filters.experience === "no_experience") {
      query = query.or(
        `experience.is.null,experience.eq.*,experience.ilike.%no_experience%,experience.ilike.%noexperience%,experience.ilike.%без опыта%`
      );
    } else {
      const patterns = {
        "1-3": "1-3",
        "3-6": "3-6",
        "6+": "6+",
      };
      const pattern = patterns[filters.experience as keyof typeof patterns];
      if (pattern) {
        query = query.or(`experience.ilike.%${pattern}%`);
      }
    }
  }

  const { data, error } = await query
    .order("published_at", { ascending: false })
    .limit(MAX_ITEMS);

  if (error) {
    console.error("[RSS Feed] Platform vacancies error:", error);
    return [];
  }

  return (data || []).map((v: any) => ({
    id: `platform_${v.id}`,
    title: v.title,
    company: v.company,
    city: v.city,
    salary_from: v.salary_from,
    salary_to: v.salary_to,
    description: v.description,
    url: `${siteUrl}/vacancies/${v.id}`,
    published_at: v.published_at || v.created_at,
    source: "platform",
    experience: v.experience,
  }));
}

/**
 * Fetch network vacancies
 */
async function getNetworkVacancies(
  supabase: any,
  filters: {
    query?: string;
    city?: string;
    experience?: string;
    sources?: string[];
  }
): Promise<any[]> {
  let query = supabase
    .from("vacancies_storage")
    .select("*")
    .eq("is_active", true)
    .eq("is_public", true);

  if (filters.sources && filters.sources.length > 0) {
    query = query.in("source", filters.sources);
  }

  if (filters.query) {
    query = query.or(
      `title.ilike.%${filters.query}%,description.ilike.%${filters.query}%,company.ilike.%${filters.query}%`
    );
  }

  if (filters.city) {
    query = query.ilike("city", `%${filters.city}%`);
  }

  if (filters.experience) {
    if (filters.experience === "no_experience") {
      query = query.or(
        `experience.is.null,experience.eq.*,experience.ilike.%no_experience%,experience.ilike.%noexperience%,experience.ilike.%без опыта%`
      );
    } else {
      const patterns = {
        "1-3": "1-3",
        "3-6": "3-6",
        "6+": "6+",
      };
      const pattern = patterns[filters.experience as keyof typeof patterns];
      if (pattern) {
        query = query.or(`experience.ilike.%${pattern}%`);
      }
    }
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(MAX_ITEMS);

  if (error) {
    console.error("[RSS Feed] Network vacancies error:", error);
    return [];
  }

  return (data || []).map((v: any) => ({
    id: `${v.source}_${v.source_id}`,
    title: v.title,
    company: v.company || "",
    city: v.city || "",
    salary_from: v.salary_from,
    salary_to: v.salary_to,
    description: v.description || "",
    url: `${siteUrl}/vacancies/${v.source}_${v.source_id}`,
    published_at: v.created_at,
    source: v.source,
    experience: v.experience,
  }));
}

/**
 * Format salary for display
 */
function formatSalary(from?: number, to?: number): string {
  if (from && to) {
    return `${from.toLocaleString("ru-RU")} - ${to.toLocaleString("ru-RU")} ₽`;
  }
  if (from) {
    return `от ${from.toLocaleString("ru-RU")} ₽`;
  }
  if (to) {
    return `до ${to.toLocaleString("ru-RU")} ₽`;
  }
  return "";
}

/**
 * Generate RSS item XML
 */
function generateRSSItem(vacancy: any): string {
  const title = escapeXml(sanitizeString(vacancy.title));
  const company = escapeXml(sanitizeString(vacancy.company));
  const city = escapeXml(sanitizeString(vacancy.city));
  const description = escapeXml(truncateText(vacancy.description || "", 300));
  const salary = formatSalary(vacancy.salary_from, vacancy.salary_to);
  const sourceLabel = getSourceLabel(vacancy.source);
  const pubDate = formatRSSDate(vacancy.published_at);

  return `    <item>
      <title>${title} (${company})</title>
      <link>${vacancy.url}</link>
      <description><![CDATA[${description}${salary ? `<br/><br/><strong>Зарплата:</strong> ${escapeXml(salary)}` : ""}<br/><strong>Город:</strong> ${city}<br/><strong>Источник:</strong> ${sourceLabel}]]></description>
      <category>${sourceLabel}</category>
      ${city ? `<category>${escapeXml(city)}</category>` : ""}
      <author>${company}</author>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${vacancy.url}</guid>
    </item>`;
}

/**
 * GET /api/vacancies/rss - RSS 2.0 Feed
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and sanitize filters
    const rawQuery = searchParams.get("query");
    const query = rawQuery
      ? sanitizeString(rawQuery.slice(0, MAX_QUERY_LENGTH))
      : undefined;

    const rawCity = searchParams.get("city");
    const city = rawCity
      ? sanitizeString(rawCity.slice(0, MAX_QUERY_LENGTH))
      : undefined;

    const rawExperience = searchParams.get("experience");
    const experience = rawExperience
      ? sanitizeString(rawExperience.slice(0, MAX_QUERY_LENGTH))
      : undefined;

    const rawSource = searchParams.get("source");
    const sources = rawSource
      ? rawSource.split(",").map(s => sanitizeString(s.trim())).filter(Boolean)
      : undefined;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch vacancies
    const [platformVacancies, networkVacancies] = await Promise.all([
      getPlatformVacancies(supabase, { query, city, experience }),
      getNetworkVacancies(supabase, { query, city, experience, sources }),
    ]);

    // Combine and limit
    const allVacancies = [...platformVacancies, ...networkVacancies]
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
      .slice(0, MAX_ITEMS);

    // Generate feed title based on filters
    const titleParts = ["JobAISearch - Вакансии"];
    if (query) titleParts.push(query);
    if (city) titleParts.push(city);
    if (experience) {
      const expLabels: Record<string, string> = {
        no_experience: "Без опыта",
        "1-3": "1-3 года",
        "3-6": "3-6 лет",
        "6+": "6+ лет",
      };
      titleParts.push(expLabels[experience] || experience);
    }
    const feedTitle = titleParts.join(" - ");

    // Generate description
    const descriptionParts = ["Актуальные вакансии"];
    if (query) descriptionParts.push(`"${query}"`);
    if (city) descriptionParts.push(`в ${city}`);
    const feedDescription = descriptionParts.join(" ") + ".";

    // Generate RSS items
    const items = allVacancies.map(v => generateRSSItem(v)).join("\n");

    // Generate RSS XML
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(feedTitle)}</title>
    <link>${siteUrl}/vacancies</link>
    <description>${escapeXml(feedDescription)}</description>
    <language>ru</language>
    <lastBuildDate>${formatRSSDate(new Date())}</lastBuildDate>
    <atom:link href="${siteUrl}/api/vacancies/rss${searchParams.toString() ? '?' + searchParams.toString() : ''}" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

    return new NextResponse(rss, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=1800", // 30 minutes
      },
    });
  } catch (error) {
    console.error("[RSS Feed] Error:", error);

    // Return error RSS
    const errorRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Error - JobAISearch Feed</title>
    <description>Error generating feed. Please try again later.</description>
  </channel>
</rss>`;

    return new NextResponse(errorRss, {
      status: 500,
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  }
}
