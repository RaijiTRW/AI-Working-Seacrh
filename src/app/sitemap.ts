import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jobaisearch.ru";

// Performance limits
const MAX_PLATFORM_VACANCIES = 5000;
const MAX_NETWORK_VACANCIES = 5000;
const MAX_TOTAL_VACANCIES = 10000;

// ISR revalidation - regenerate sitemap every hour
export const revalidate = 3600;

// Fetch platform vacancies (employer_vacancies) for sitemap
async function getPlatformVacancies(): Promise<MetadataRoute.Sitemap> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("[Sitemap] Supabase env vars not set");
    return [];
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase
    .from("employer_vacancies")
    .select("id, updated_at, published_at")
    .eq("status", "published")
    .eq("is_active", true)
    .eq("is_public", true)
    .order("published_at", { ascending: false })
    .limit(MAX_PLATFORM_VACANCIES);

  if (error) {
    console.error("[Sitemap] Failed to fetch platform vacancies:", error);
    return [];
  }

  return (data || []).map((vacancy) => ({
    url: `${SITE_URL}/vacancies/${vacancy.id}`,
    lastModified: new Date(vacancy.updated_at || vacancy.published_at || new Date()),
    changeFrequency: "daily" as const,
    priority: 0.9, // Higher priority for platform vacancies
  }));
}

// Fetch network vacancies (hh, avito, superjob) for sitemap
async function getNetworkVacancies(): Promise<MetadataRoute.Sitemap> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("[Sitemap] Supabase env vars not set");
    return [];
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase
    .from("vacancies_storage")
    .select("id, source, source_id, updated_at, created_at")
    .eq("is_active", true)
    .eq("is_public", true)  // Security: Only include public vacancies
    .in("source", ["hh", "avito", "superjob"])
    .order("created_at", { ascending: false })
    .limit(MAX_NETWORK_VACANCIES);

  if (error) {
    console.error("[Sitemap] Failed to fetch network vacancies:", error);
    return [];
  }

  return (data || []).map((vacancy) => ({
    url: `${SITE_URL}/vacancies/${vacancy.source}_${vacancy.source_id}`,
    lastModified: new Date(vacancy.updated_at || vacancy.created_at || new Date()),
    changeFrequency: "daily" as const,
    priority: 0.7, // Lower priority for network vacancies
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages with high priority
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/vacancies`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/employers`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/chat`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/subscription`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // Fetch platform vacancies (higher priority)
  const platformVacancies = await getPlatformVacancies();

  // Fetch network vacancies from hh, avito, superjob (lower priority)
  const networkVacancies = await getNetworkVacancies();

  // Combine all vacancies with total limit
  const allVacancies = [...platformVacancies, ...networkVacancies].slice(0, MAX_TOTAL_VACANCIES);

  console.log(
    `[Sitemap] Generated ${platformVacancies.length} platform + ${networkVacancies.length} network = ${allVacancies.length} total vacancies`
  );

  return [...staticPages, ...allVacancies];
}
