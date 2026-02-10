/**
 * SEO Utilities and Metadata Generators
 * Provides functions for generating dynamic metadata, JSON-LD structured data, and SEO-friendly content
 */

import { Metadata } from "next";
import { EmployerVacancy, NetworkVacancy } from "./api";
import { sanitizeString, sanitizeUrl, sanitizeStringArray } from "./sanitize";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobaisearch.ru";
const siteName = "JobAISearch";

/**
 * Default metadata configuration for the site
 */
export const DEFAULT_METADATA = {
  title: "JobAISearch — Умный поиск работы с ИИ",
  description:
    "Найдите работу быстрее с помощью искусственного интеллекта. Вакансии с hh.ru, Avito, SuperJob в одном месте. Персональный подбор без дубликатов.",
  keywords: [
    "поиск работы",
    "вакансии",
    "работа в России",
    "hh.ru",
    "avito работа",
    "superjob",
    "ИИ поиск вакансий",
    "найти работу",
    "трудоустройство",
    "карьера",
    "работа Москва",
    "удаленная работа",
    "работа Санкт-Петербург",
    "вакансии для начинающих",
    "работа без опыта",
  ],
  siteName,
  siteUrl,
  locale: "ru_RU",
  type: "website" as const,
};

/**
 * Format salary for display in metadata
 */
function formatSalaryForMetadata(from?: number, to?: number): string {
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
 * Truncate text to specific length (with HTML sanitization for security)
 */
function truncateText(text: string, maxLength: number): string {
  // First strip HTML to prevent broken tags
  const cleanText = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

  if (cleanText.length <= maxLength) return cleanText;
  return cleanText.slice(0, maxLength - 3).trim() + "...";
}

/**
 * Generate metadata for vacancy detail pages
 */
export function generateVacancyMetadata(vacancy: EmployerVacancy): Metadata {
  // Sanitize all user input for security
  const sanitizedTitle = sanitizeString(vacancy.title);
  const sanitizedCompany = sanitizeString(vacancy.company);
  const sanitizedCity = sanitizeString(vacancy.city);
  const sanitizedDescription = vacancy.description
    ? sanitizeString(vacancy.description)
    : "";

  const salary = formatSalaryForMetadata(vacancy.salary_from, vacancy.salary_to);
  const title = salary
    ? `${sanitizedTitle} (${salary}) - ${sanitizedCompany} | ${siteName}`
    : `${sanitizedTitle} - ${sanitizedCompany} | ${siteName}`;

  const description = sanitizedDescription
    ? truncateText(sanitizedDescription, 160)
    : `Вакансия "${sanitizedTitle}" в компании ${sanitizedCompany}. ${sanitizedCity}. ${salary ? salary : ""}`;

  const keywords = [
    sanitizedTitle,
    sanitizedCompany,
    sanitizedCity,
    "вакансия",
    "работа",
    ...(vacancy.experience ? [vacancy.experience] : []),
    ...(vacancy.employment_type ? [vacancy.employment_type] : []),
  ];

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: "article",
      url: `${siteUrl}/vacancies/${vacancy.id}`,
      siteName,
      locale: "ru_RU",
      publishedTime: vacancy.published_at || vacancy.created_at,
      modifiedTime: vacancy.updated_at,
      expirationTime: vacancy.valid_through,
      authors: [sanitizedCompany],
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `${sanitizedTitle} - ${sanitizedCompany}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
    alternates: {
      canonical: `${siteUrl}/vacancies/${vacancy.id}`,
    },
  };
}

/**
 * Generate metadata for vacancies listing page
 */
export function generateVacanciesMetadata(params?: {
  query?: string;
  city?: string;
  experience?: string;
}): Metadata {
  const parts = ["Вакансии"];

  if (params?.query) {
    parts.push(params.query);
  }

  if (params?.city) {
    parts.push(params.city);
  }

  if (params?.experience) {
    const expMap: Record<string, string> = {
      no_experience: "Без опыта",
      noexperience: "Без опыта",
      "1-3": "1-3 года",
      "3-6": "3-6 лет",
      "6+": "Более 6 лет",
    };
    parts.push(expMap[params.experience] || params.experience);
  }

  const title = parts.join(" ") + ` | ${siteName}`;
  const description = params
    ? `Поиск вакансий${params.query ? ` "${params.query}"` : ""}${params.city ? ` в ${params.city}` : ""}. Тысячи актуальных вакансий от работодателей.`
    : "Поиск работы в России. Тысячи актуальных вакансий от лучших работодателей. Умный подбор с помощью ИИ.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: params ? `${siteUrl}/vacancies` : siteUrl,
      siteName,
      locale: "ru_RU",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
    alternates: {
      canonical: `${siteUrl}/vacancies`,
    },
  };
}

/**
 * Generate JobPosting JSON-LD structured data for a vacancy
 * Includes all required Google Jobs fields with proper sanitization
 */
export function generateVacancyJSONLD(vacancy: EmployerVacancy | NetworkVacancy) {
  // Sanitize all user input for security (XSS prevention)
  const sanitizedTitle = sanitizeString(vacancy.title);
  const sanitizedDescription = vacancy.description
    ? sanitizeString(vacancy.description)
    : "";
  const sanitizedCompany = sanitizeString(vacancy.company);
  const sanitizedCity = sanitizeString(vacancy.city);
  const sanitizedCompanyUrl = vacancy.company_url
    ? sanitizeUrl(vacancy.company_url)
    : undefined;
  const sanitizedRequirements = vacancy.requirements
    ? sanitizeString(vacancy.requirements)
    : undefined;
  const sanitizedSkills = vacancy.skills
    ? sanitizeStringArray(Array.isArray(vacancy.skills) ? vacancy.skills : [])
    : [];
  const sanitizedWorkHours = vacancy.work_hours
    ? sanitizeString(vacancy.work_hours)
    : undefined;

  // Calculate validThrough (30 days from published/updated date if not set)
  const validThrough = vacancy.valid_through
    ? new Date(vacancy.valid_through).toISOString()
    : vacancy.updated_at
      ? new Date(new Date(vacancy.updated_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : vacancy.published_at
        ? new Date(new Date(vacancy.published_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const baseJsonLd: any = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: sanitizedTitle,
    description: sanitizedDescription,
    identifier: {
      "@type": "PropertyValue",
      name: vacancy.id,
      value: vacancy.id,
    },
    datePosted: vacancy.published_at || vacancy.created_at,
    validThrough,
    hiringOrganization: {
      "@type": "Organization",
      name: sanitizedCompany,
      ...(sanitizedCompanyUrl && { sameAs: sanitizedCompanyUrl }),
      ...(vacancy.company_logo && { logo: sanitizeUrl(vacancy.company_logo) }),
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: sanitizedCity,
        addressCountry: "RU",
      },
    },
  };

  // Add employment type mapping for Google Jobs
  const employmentTypes = mapEmploymentType(vacancy.employment_type, vacancy.schedule);
  if (employmentTypes.length > 0) {
    baseJsonLd.employmentType = employmentTypes;
  }

  // Add experience requirements
  if (vacancy.experience && vacancy.experience !== "no_experience" && vacancy.experience !== "noexperience") {
    const experienceReq = mapExperienceRequirements(vacancy.experience);
    if (experienceReq.monthsOfExperience !== undefined) {
      baseJsonLd.experienceRequirements = experienceReq;
    }
  }

  // Add salary information if available
  if (vacancy.salary_from || vacancy.salary_to) {
    baseJsonLd.baseSalary = generateSalaryFields(vacancy);
  }

  // Add skills if available
  if (sanitizedSkills.length > 0) {
    baseJsonLd.skills = sanitizedSkills;
  }

  // Add responsibilities (requirements)
  if (sanitizedRequirements) {
    baseJsonLd.responsibilities = sanitizedRequirements;
  }

  // Add work hours if available
  if (sanitizedWorkHours) {
    baseJsonLd.workHours = sanitizedWorkHours;
  }

  // Add remote work indicator
  if (vacancy.schedule === "remote") {
    baseJsonLd.jobLocationType = "TELECOMMUTE";
    baseJsonLd.applicantLocationRequirements = {
      "@type": "Country",
      name: "Russia",
    };
  }

  return baseJsonLd;
}

/**
 * Map employment type to Google Jobs schema
 */
function mapEmploymentType(employment?: string, schedule?: string): string[] {
  const types: string[] = [];

  if (employment === "full") {
    types.push("FULL_TIME");
  } else if (employment === "part") {
    types.push("PART_TIME");
  } else if (employment === "contract") {
    types.push("CONTRACTOR");
  } else if (employment === "internship") {
    types.push("INTERN");
  }

  // Remote work is typically FULL_TIME
  if (schedule === "remote" && types.length === 0) {
    types.push("FULL_TIME");
  }

  return types;
}

/**
 * Map experience requirements to months
 */
function mapExperienceRequirements(experience?: string): {
  "@type": "OccupationalExperienceRequirements";
  monthsOfExperience: number;
} {
  const expMap: Record<string, number> = {
    "no_experience": 0,
    "noexperience": 0,
    "1-3": 12,
    "between1and3": 12,
    "3-6": 36,
    "between3and6": 36,
    "6+": 72,
    "morethan6": 72,
  };

  return {
    "@type": "OccupationalExperienceRequirements",
    monthsOfExperience: expMap[experience || ""] || 0,
  };
}

/**
 * Generate salary fields for Google Jobs
 */
function generateSalaryFields(vacancy: EmployerVacancy | NetworkVacancy) {
  const salaryData: any = {
    "@type": "MonetaryAmount",
    currency: vacancy.salary_currency || "RUB",
    value: {
      "@type": "QuantitativeValue",
    },
  };

  if (vacancy.salary_from) {
    salaryData.value.minValue = vacancy.salary_from;
  }

  if (vacancy.salary_to) {
    salaryData.value.maxValue = vacancy.salary_to;
  }

  // Determine unit based on salary range
  if (vacancy.salary_from && vacancy.salary_to) {
    // If range is large (>100k), assume yearly, otherwise monthly
    const avgSalary = (vacancy.salary_from + vacancy.salary_to) / 2;
    salaryData.value.unitText = avgSalary > 100000 ? "YEAR" : "MONTH";
  } else if (vacancy.salary_from) {
    salaryData.value.unitText = vacancy.salary_from > 100000 ? "YEAR" : "MONTH";
  } else if (vacancy.salary_to) {
    salaryData.value.unitText = vacancy.salary_to > 100000 ? "YEAR" : "MONTH";
  }

  return salaryData;
}

/**
 * Generate BreadcrumbList JSON-LD with sanitization
 */
export function generateBreadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: sanitizeString(item.name),
      item: sanitizeUrl(item.url),
    })),
  };
}

/**
 * Generate WebSite schema with search action
 */
export function generateWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    description: DEFAULT_METADATA.description,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/vacancies?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Generate Organization schema
 */
export function generateOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    logo: `${siteUrl}/favicon-master-512.png`,
    description: DEFAULT_METADATA.description,
    sameAs: [] as string[], // Add social media links if available
  };
}

/**
 * Generate FAQPage schema for FAQ sections
 */
export function generateFAQJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Format experience for display
 */
export function formatExperienceForSEO(experience?: string): string | null {
  if (!experience) return null;

  const experienceMap: Record<string, string> = {
    no_experience: "Без опыта",
    noexperience: "Без опыта",
    "1-3": "1-3 года",
    "3-6": "3-6 лет",
    "6+": "Более 6 лет",
    between1and3: "1-3 года",
    between3and6: "3-6 лет",
    morethan6: "Более 6 лет",
  };

  return experienceMap[experience] || experience;
}

/**
 * Format employment type for display
 */
export function formatEmploymentTypeForSEO(employment?: string): string | null {
  if (!employment) return null;

  const employmentMap: Record<string, string> = {
    full: "Полная занятость",
    part: "Частичная занятость",
    project: "Проектная работа",
    internship: "Стажировка",
    remote: "Удалённая работа",
  };

  return employmentMap[employment] || employment;
}

/**
 * Format schedule for display
 */
export function formatScheduleForSEO(schedule?: string): string | null {
  if (!schedule) return null;

  const scheduleMap: Record<string, string> = {
    fullDay: "Полный день",
    shift: "Сменный график",
    flexible: "Гибкий график",
    remote: "Удалённая работа",
  };

  return scheduleMap[schedule] || schedule;
}

/**
 * Generate robots metadata
 */
export function generateRobotsMetadata(options?: {
  noindex?: boolean;
  nofollow?: boolean;
}): { robots: { index: boolean; follow: boolean; googleBot: any } } {
  const noindex = options?.noindex ?? false;
  const nofollow = options?.nofollow ?? false;

  return {
    robots: {
      index: !noindex,
      follow: !nofollow,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}
