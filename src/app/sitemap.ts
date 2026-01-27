import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

// Fetch vacancies for sitemap (server-side)
async function getActiveVacancies() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Supabase env vars not set for sitemap");
    return [];
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase
    .from("employer_vacancies")
    .select("id, updated_at, published_at, title")
    .eq("status", "active")
    .eq("is_active", true)
    .order("published_at", { ascending: false })
    .limit(5000); // Limit for sitemap performance

  if (error) {
    console.error("Failed to fetch vacancies for sitemap:", error);
    return [];
  }

  return data || [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobaisearch.ru";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/vacancies`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/employers`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/chat`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/subscription`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // Fetch all active vacancies
  const vacancies = await getActiveVacancies();

  // Generate vacancy URLs
  const vacancyPages: MetadataRoute.Sitemap = vacancies.map((vacancy) => ({
    url: `${baseUrl}/vacancies/${vacancy.id}`,
    lastModified: new Date(vacancy.updated_at || vacancy.published_at || new Date()),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...vacancyPages];
}
