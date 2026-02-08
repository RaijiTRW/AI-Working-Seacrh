import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { log } from "@/lib/logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

interface Vacancy {
  id: string;
  title: string;
  company: string;
  salary_from?: number;
  salary_to?: number;
  city: string;
  experience?: string;
  employment_type?: string;
  description: string;
  url: string;
  source: string;
  user_id?: string;
  created_at?: string;
  published_at?: string;
}

// GET /api/vacancies/feed - Получить ленту вакансий
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("query") || undefined;
  const city = searchParams.get("city") || undefined;
  const salaryFrom = searchParams.get("salary_from") ? parseInt(searchParams.get("salary_from")!) : undefined;
  const experience = searchParams.get("experience") || undefined;
  const source = searchParams.get("source") || undefined; // platform, hh, superjob, avito, or comma-separated, or undefined (all)
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
  const offset = (page - 1) * limit;

  const supabase = getSupabaseAdmin();

  // Parse sources - can be comma-separated like "hh,superjob,platform"
  const sources = source ? source.split(",").map(s => s.trim()) : [];
  const includePlatform = !source || sources.includes("platform");
  const networkSources = sources.filter(s => ["hh", "superjob", "avito"].includes(s));
  const includeNetwork = !source || networkSources.length > 0;

  try {
    let networkVacancies: any[] = [];
    let networkTotal = 0;
    let platformVacancies: any[] = [];
    let platformTotal = 0;

    // === 1. Вакансии из сети (vacancies_storage: hh, avito, superjob) ===
    if (includeNetwork) {
      let networkQuery = supabase
        .from("vacancies_storage")
        .select("*", { count: "exact" })
        .eq("is_active", true);

      // Фильтр по источникам, если указаны конкретные
      if (networkSources.length > 0) {
        networkQuery = networkQuery.in("source", networkSources);
      }

      // Фильтры
      if (query) {
        networkQuery = networkQuery.or(
          `title.ilike.%${query}%,description.ilike.%${query}%,company.ilike.%${query}%`
        );
      }

      // Поддержка множественных городов через запятую
      if (city) {
        const cities = city.split(",").map(c => c.trim().toLowerCase());
        if (cities.length === 1) {
          networkQuery = networkQuery.ilike("city", `%${cities[0]}%`);
        } else {
          const cityConditions = cities.map(c => `city.ilike.%${c}%`).join(",");
          networkQuery = networkQuery.or(`(${cityConditions})`);
        }
      }

      if (salaryFrom) {
        networkQuery = networkQuery.or(
          `salary_from.gte.${salaryFrom},salary_to.gte.${salaryFrom}`
        );
      }

      // Опыт работы (поддержка разных форматов)
      if (experience) {
        const expPatterns = getExperiencePatterns(experience);
        if (expPatterns.length > 0) {
          const expConditions = expPatterns.map(p => `experience.ilike.%${p}%`).join(",");
          networkQuery = networkQuery.or(`(${expConditions})`);
        }
      }

      networkQuery = networkQuery
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: networkData, count: networkCount, error: networkError } = await networkQuery;

      if (networkError) {
        log.error("[VacancyFeed] Network vacancies error:", networkError);
      } else {
        networkVacancies = (networkData || []).map((v: any) => ({
          id: `${v.source}_${v.source_id}`,
          title: v.title,
          company: v.company || "",
          salary_from: v.salary_from,
          salary_to: v.salary_to,
          city: v.city || "",
          experience: v.experience,
          employment_type: v.employment_type,
          description: v.description || "",
          url: v.url,
          source: v.source,
          created_at: v.created_at,
          published_at: v.created_at, // Use created_at as published_at for network vacancies
        }));
        networkTotal = networkCount || 0;
      }
    }

    // === 2. Наши вакансии (employer_vacancies) ===
    if (includePlatform) {
      let platformQuery = supabase
        .from("employer_vacancies")
        .select("*", { count: "exact" })
        .eq("status", "published")
        .eq("is_active", true);

      // Фильтры
      if (query) {
        platformQuery = platformQuery.or(
          `title.ilike.%${query}%,description.ilike.%${query}%,company.ilike.%${query}%`
        );
      }

      if (city) {
        const cities = city.split(",").map(c => c.trim().toLowerCase());
        if (cities.length === 1) {
          platformQuery = platformQuery.ilike("city", `%${cities[0]}%`);
        } else {
          const cityConditions = cities.map(c => `city.ilike.%${c}%`).join(",");
          platformQuery = platformQuery.or(`(${cityConditions})`);
        }
      }

      if (salaryFrom) {
        platformQuery = platformQuery.or(
          `salary_from.gte.${salaryFrom},salary_to.gte.${salaryFrom}`
        );
      }

      if (experience) {
        const expPatterns = getExperiencePatterns(experience);
        if (expPatterns.length > 0) {
          const expConditions = expPatterns.map(p => `experience.ilike.%${p}%`).join(",");
          platformQuery = platformQuery.or(`(${expConditions})`);
        }
      }

      platformQuery = platformQuery
        .order("published_at", { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: platformData, count: platformCount, error: platformError } = await platformQuery;

      if (platformError) {
        log.error("[VacancyFeed] Platform vacancies error:", platformError);
      } else {
        platformVacancies = (platformData || []).map((v: any) => ({
          id: `platform_${v.id}`,
          title: v.title,
          company: v.company,
          salary_from: v.salary_from,
          salary_to: v.salary_to,
          city: v.city,
          experience: v.experience,
          employment_type: v.employment_type,
          description: v.description,
          url: `/vacancies/${v.id}`, // Внутренняя ссылка
          source: "platform",
          user_id: v.user_id,
          created_at: v.created_at,
          published_at: v.published_at || v.created_at,
        }));
        platformTotal = platformCount || 0;
      }
    }

    log.info(
      `[VacancyFeed] Network: ${networkVacancies.length} (total: ${networkTotal}), Platform: ${platformVacancies.length} (total: ${platformTotal}), source=${source}`
    );

    // === 3. Объединяем (наши вакансии в приоритете — сверху) ===
    const allVacancies = [...platformVacancies, ...networkVacancies];
    const total = networkTotal + platformTotal;
    const pages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      vacancies: allVacancies,
      total,
      page,
      pages,
      has_next: page < pages,
    });
  } catch (error) {
    log.error("[VacancyFeed] Error:", error);
    return NextResponse.json(
      {
        vacancies: [],
        total: 0,
        page,
        pages: 1,
        has_next: false
      },
      { status: 500 }
    );
  }
}

// Хелпер для маппинга опыта работы
function getExperiencePatterns(experience: string): string[] {
  const patternsMap: Record<string, string[]> = {
    "no_experience": [
      "no_experience",
      "noexperience",
      "без опыта",
      "не требуется",
      "нет опыта",
      "without experience",
      "no experience",
    ],
    "1-3": [
      "1-3",
      "between1and3",
      "от 1 до 3",
      "1 до 3",
      "1-3 года",
      "от 1 года до 3 лет",
      "1–3",
    ],
    "3-6": [
      "3-6",
      "between3and6",
      "от 3 до 6",
      "3 до 6",
      "3-6 лет",
      "от 3 лет до 6 лет",
      "3–6",
    ],
    "6+": [
      "6+",
      "morethan6",
      "более 6",
      "больше 6",
      "от 6 лет",
      "more than 6",
      "6 лет и более",
    ],
  };

  return patternsMap[experience] || [experience];
}
