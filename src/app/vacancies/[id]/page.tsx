import { Metadata } from "next";
import VacancyDetailClient from "./VacancyDetailClient";
import { getVacancy, isNetworkVacancyId, EmployerVacancy, NetworkVacancy } from "@/lib/api";
import { notFound } from "next/navigation";
import { JobPostingJsonLd, BreadcrumbJsonLd } from "@/components/seo";
import { generateVacancyJSONLD } from "@/lib/seo-core";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// Helper function to strip "platform_" prefix if present
function sanitizeVacancyId(id: string): string {
  if (id.startsWith("platform_")) {
    return id.replace("platform_", "");
  }
  return id;
}

/**
 * Generate metadata for platform vacancies
 */
function generatePlatformMetadata(vacancy: EmployerVacancy, id: string): Metadata {
  const salary =
    vacancy.salary_from || vacancy.salary_to
      ? `${vacancy.salary_from ? `от ${vacancy.salary_from.toLocaleString("ru-RU")}` : ""}${
          vacancy.salary_to ? (vacancy.salary_from ? " - " : "до ") + vacancy.salary_to.toLocaleString("ru-RU") : ""
        } ₽`
      : "";

  const title = salary
    ? `${vacancy.title} (${salary}) - ${vacancy.company} | JobAISearch`
    : `${vacancy.title} - ${vacancy.company} | JobAISearch`;

  const description = vacancy.description
    ? vacancy.description.slice(0, 160) + (vacancy.description.length > 160 ? "..." : "")
    : `Вакансия "${vacancy.title}" в компании ${vacancy.company}. ${vacancy.city}. ${salary}`;

  const keywords = [
    vacancy.title,
    vacancy.company,
    vacancy.city,
    "вакансия",
    "работа",
    vacancy.experience || "",
    vacancy.employment_type || "",
  ].filter(Boolean);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobaisearch.ru";
  const ogImageUrl = `${siteUrl}/api/og/${id}`;

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: "article",
      url: `${siteUrl}/vacancies/${id}`,
      siteName: "JobAISearch",
      locale: "ru_RU",
      publishedTime: vacancy.published_at || vacancy.created_at,
      modifiedTime: vacancy.updated_at,
      authors: [vacancy.company],
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${vacancy.title} - ${vacancy.company}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `${siteUrl}/vacancies/${id}`,
    },
  };
}

/**
 * Generate metadata for network vacancies (hh, avito, superjob)
 */
function generateNetworkMetadata(vacancy: NetworkVacancy, id: string): Metadata {
  const salary =
    vacancy.salary_from || vacancy.salary_to
      ? `${vacancy.salary_from ? `от ${vacancy.salary_from.toLocaleString("ru-RU")}` : ""}${
          vacancy.salary_to ? (vacancy.salary_from ? " - " : "до ") + vacancy.salary_to.toLocaleString("ru-RU") : ""
        } ₽`
      : "";

  const sourceLabel = vacancy.source === "hh" ? "hh.ru" : vacancy.source === "avito" ? "Avito" : "SuperJob";
  const title = salary
    ? `${vacancy.title} (${salary}) - ${vacancy.company} | ${sourceLabel} | JobAISearch`
    : `${vacancy.title} - ${vacancy.company} | ${sourceLabel} | JobAISearch`;

  const description = vacancy.description
    ? vacancy.description.slice(0, 160) + (vacancy.description.length > 160 ? "..." : "")
    : `Вакансия "${vacancy.title}" в компании ${vacancy.company}. ${vacancy.city}. ${salary}`;

  const keywords = [
    vacancy.title,
    vacancy.company,
    vacancy.city,
    "вакансия",
    "работа",
    vacancy.experience || "",
    vacancy.employment_type || "",
    sourceLabel,
  ].filter(Boolean);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobaisearch.ru";
  const ogImageUrl = `${siteUrl}/api/og/${id}`;

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: "article",
      url: `${siteUrl}/vacancies/${id}`,
      siteName: "JobAISearch",
      locale: "ru_RU",
      publishedTime: vacancy.created_at,
      modifiedTime: vacancy.updated_at,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${vacancy.title} - ${vacancy.company}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `${siteUrl}/vacancies/${id}`,
    },
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const vacancyId = sanitizeVacancyId(id);

  try {
    // Check if network vacancy
    if (isNetworkVacancyId(vacancyId)) {
      const vacancy = await getVacancy(vacancyId) as NetworkVacancy;
      return generateNetworkMetadata(vacancy, id);
    }

    // Platform vacancy
    const vacancy = await getVacancy(vacancyId) as EmployerVacancy;
    return generatePlatformMetadata(vacancy, id);
  } catch (error) {
    // Fallback metadata if vacancy fetch fails
    return {
      title: "Вакансия | JobAISearch",
      description: "Поиск работы в России",
    };
  }
}

export default async function VacancyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const vacancyId = sanitizeVacancyId(id);

  let vacancy: EmployerVacancy | NetworkVacancy | null = null;
  let isNetwork = false;

  try {
    // Check if network vacancy
    isNetwork = isNetworkVacancyId(vacancyId);
    vacancy = await getVacancy(vacancyId);
  } catch (error) {
    notFound();
  }

  if (!vacancy) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobaisearch.ru";

  // Generate breadcrumb structured data
  const breadcrumbItems = [
    { name: "Главная", url: siteUrl },
    { name: "Вакансии", url: `${siteUrl}/vacancies` },
    { name: vacancy.title, url: `${siteUrl}/vacancies/${id}` },
  ];

  // Generate JSON-LD structured data
  let jsonLd = null;
  try {
    jsonLd = generateVacancyJSONLD(vacancy);
  } catch (error) {
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <VacancyDetailClient
        vacancyId={vacancyId}
        initialVacancy={vacancy}
        isNetwork={isNetwork}
      />
    </>
  );
}
