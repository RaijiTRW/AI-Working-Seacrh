import { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

interface VacancyData {
  id: string;
  title: string;
  company: string;
  city: string;
  salary_from?: number;
  salary_to?: number;
  salary_currency: string;
  experience?: string;
  employment_type?: string;
  description: string;
  requirements?: string;
  published_at?: string;
  updated_at?: string;
}

// Server-side fetch for metadata
async function getVacancy(id: string): Promise<VacancyData | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase
    .from("employer_vacancies")
    .select("*")
    .eq("id", id)
    // Keep in sync with public vacancy visibility rules (see /api/vacancies/[id])
    .in("status", ["published", "active"])
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return null;
  }

  return data as VacancyData;
}

function formatSalaryForMeta(from?: number, to?: number): string {
  if (from && to) {
    return `${from.toLocaleString("ru-RU")} - ${to.toLocaleString("ru-RU")} руб.`;
  }
  if (from) {
    return `от ${from.toLocaleString("ru-RU")} руб.`;
  }
  if (to) {
    return `до ${to.toLocaleString("ru-RU")} руб.`;
  }
  return "";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const vacancy = await getVacancy(id);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobaisearch.ru";

  if (!vacancy) {
    return {
      title: "Вакансия не найдена",
      description: "Эта вакансия была удалена или скрыта.",
    };
  }

  const salaryText = formatSalaryForMeta(vacancy.salary_from, vacancy.salary_to);
  const description = `${vacancy.title} в ${vacancy.company}, ${vacancy.city}${salaryText ? `. Зарплата: ${salaryText}` : ""}. ${vacancy.description?.slice(0, 150) || ""}...`;

  return {
    title: `${vacancy.title} — ${vacancy.company}`,
    description: description.slice(0, 160),
    keywords: [
      vacancy.title,
      vacancy.company,
      vacancy.city,
      "вакансия",
      "работа",
      vacancy.experience || "",
      vacancy.employment_type || "",
    ].filter(Boolean),
    openGraph: {
      title: `${vacancy.title} — ${vacancy.company} | JobAISearch`,
      description: description.slice(0, 200),
      url: `${siteUrl}/vacancies/${vacancy.id}`,
      type: "article",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: vacancy.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${vacancy.title} — ${vacancy.company}`,
      description: description.slice(0, 200),
    },
    alternates: {
      canonical: `${siteUrl}/vacancies/${vacancy.id}`,
    },
  };
}

function getEmploymentTypeSchema(type?: string): string {
  switch (type) {
    case "full":
      return "FULL_TIME";
    case "part":
      return "PART_TIME";
    case "remote":
      return "TELECOMMUTE";
    case "contract":
      return "CONTRACTOR";
    case "intern":
      return "INTERN";
    default:
      return "FULL_TIME";
  }
}

function getExperienceRequirements(exp?: string): object | undefined {
  if (!exp) return undefined;

  const expLower = exp.toLowerCase();
  if (expLower.includes("без опыта") || expLower.includes("не требуется")) {
    return {
      "@type": "OccupationalExperienceRequirements",
      monthsOfExperience: 0,
    };
  }
  if (expLower.includes("1-3") || expLower.includes("от 1")) {
    return {
      "@type": "OccupationalExperienceRequirements",
      monthsOfExperience: 12,
    };
  }
  if (expLower.includes("3-6") || expLower.includes("от 3")) {
    return {
      "@type": "OccupationalExperienceRequirements",
      monthsOfExperience: 36,
    };
  }
  if (expLower.includes("более 6") || expLower.includes("от 6")) {
    return {
      "@type": "OccupationalExperienceRequirements",
      monthsOfExperience: 72,
    };
  }
  return undefined;
}

export default async function VacancyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vacancy = await getVacancy(id);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobaisearch.ru";

  if (!vacancy) {
    return children;
  }

  // Google JobPosting structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: vacancy.title,
    description: `${vacancy.description || ""}${vacancy.requirements ? `\n\nТребования:\n${vacancy.requirements}` : ""}`,
    identifier: {
      "@type": "PropertyValue",
      name: vacancy.company,
      value: vacancy.id,
    },
    datePosted: vacancy.published_at || vacancy.updated_at || new Date().toISOString(),
    validThrough: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
    employmentType: getEmploymentTypeSchema(vacancy.employment_type),
    hiringOrganization: {
      "@type": "Organization",
      name: vacancy.company,
      sameAs: siteUrl,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: vacancy.city,
        addressCountry: "RU",
      },
    },
    ...(vacancy.salary_from || vacancy.salary_to
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: vacancy.salary_currency || "RUB",
            value: {
              "@type": "QuantitativeValue",
              ...(vacancy.salary_from && vacancy.salary_to
                ? {
                    minValue: vacancy.salary_from,
                    maxValue: vacancy.salary_to,
                  }
                : vacancy.salary_from
                ? { minValue: vacancy.salary_from }
                : { maxValue: vacancy.salary_to }),
              unitText: "MONTH",
            },
          },
        }
      : {}),
    ...(vacancy.experience
      ? { experienceRequirements: getExperienceRequirements(vacancy.experience) }
      : {}),
    directApply: true,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
