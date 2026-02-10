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
 * Format date for Atom (ISO 8601)
 */
function formatAtomDate(date: string | Date): string {
  return new Date(date).toISOString();
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
    console.error("[Atom Feed] Platform vacancies error:", error);
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
    updated_at: v.updated_at || v.published_at || v.created_at,
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
    console.error("[Atom Feed] Network vacancies error:", error);
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
    updated_at: v.updated_at || v.created_at,
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
 * Generate Atom entry XML
 */
function generateAtomEntry(vacancy: any): string {
  const title = escapeXml(sanitizeString(vacancy.title));
  const company = escapeXml(sanitizeString(vacancy.company));
  const city = escapeXml(sanitizeString(vacancy.city));
  const description = escapeXml(truncateText(vacancy.description || "", 300));
  const salary = formatSalary(vacancy.salary_from, vacancy.salary_to);
  const sourceLabel = getSourceLabel(vacancy.source);
  const published = formatAtomDate(vacancy.published_at);
  const updated = formatAtomDate(vacancy.updated_at);

  return `    <entry>
      <title type="html">${title} (${company})</title>
      <link href="${vacancy.url}" />
      <id>${vacancy.url}</id>
      <published>${published}</published>
      <updated>${updated}</updated>
      <author>
        <name>${company}</name>
      </author>
      <content type="html">
&lt;![CDATA[${description}${salary ? `<br/><br/><strong>Зарплата:</strong> ${escapeXml(salary)}` : ""}<br/><strong>Город:</strong> ${city}<br/><strong>Источник:</strong> ${sourceLabel}]]&gt;
      </content>
      <category term="${escapeXml(sourceLabel)}" label="${escapeXml(sourceLabel)}" />
      ${city ? `<category term="${escapeXml(city)}" label="${escapeXml(city)}" />` : ""}
    </entry>`;
}

/**
 * GET /api/vacancies/atom - Atom 1.0 Feed
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

    // Get the most recent update date
    const lastUpdated = allVacancies.length > 0
      ? formatAtomDate(new Date(Math.max(...allVacancies.map(v => new Date(v.updated_at).getTime()))))
      : formatAtomDate(new Date());

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

    // Generate Atom entries
    const entries = allVacancies.map(v => generateAtomEntry(v)).join("\n");

    // Generate Atom XML
    const queryString = searchParams.toString();
    const feedUrl = `${siteUrl}/api/vacancies/atom${queryString ? '?' + queryString : ''}`;

    const atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title type="text">${escapeXml(feedTitle)}</title>
  <link href="${siteUrl}/vacancies" rel="alternate" />
  <link href="${feedUrl}" rel="self" type="application/atom+xml" />
  <id>${siteUrl}/vacancies</id>
  <updated>${lastUpdated}</updated>
  <subtitle type="text">${escapeXml(feedDescription)}</subtitle>
  <author>
    <name>JobAISearch</name>
    <email>support@jobaisearch.ru</email>
  </author>
  <rights>© ${new Date().getFullYear()} JobAISearch</rights>
  <generator uri="https://jobaisearch.ru" version="1.0">JobAISearch RSS Generator</generator>
${entries}
</feed>`;

    return new NextResponse(atom, {
      headers: {
        "Content-Type": "application/atom+xml; charset=utf-8",
        "Cache-Control": "public, max-age=1800", // 30 minutes
      },
    });
  } catch (error) {
    console.error("[Atom Feed] Error:", error);

    // Return error Atom
    const errorAtom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Error - JobAISearch Feed</title>
  <subtitle>Error generating feed. Please try again later.</subtitle>
  <updated>${formatAtomDate(new Date())}</updated>
</feed>`;

    return new NextResponse(errorAtom, {
      status: 500,
      headers: {
        "Content-Type": "application/atom+xml; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  }
}
