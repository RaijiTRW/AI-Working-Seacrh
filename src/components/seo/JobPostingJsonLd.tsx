/**
 * JobPosting JSON-LD Component
 * Renders Schema.org JobPosting structured data for SEO
 */

import { EmployerVacancy } from "@/lib/api";
import { generateVacancyJSONLD } from "@/lib/seo-core";

interface JobPostingJsonLdProps {
  vacancy: EmployerVacancy;
}

export function JobPostingJsonLd({ vacancy }: JobPostingJsonLdProps) {
  const jsonLd = generateVacancyJSONLD(vacancy);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
