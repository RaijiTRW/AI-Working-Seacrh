import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sanitizeString } from "@/lib/sanitize";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobaisearch.ru";

/**
 * Google Jobs XML Feed Endpoint
 * Returns XML feed compatible with Google Jobs requirements
 * GET /api/jobs-feed
 */
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch only published, active, and public vacancies
    const { data: vacancies, error } = await supabase
      .from("employer_vacancies")
      .select("*")
      .eq("status", "published")
      .eq("is_active", true)
      .eq("is_public", true)
      .order("published_at", { ascending: false })
      .limit(5000); // Limit for performance

    if (error) {
      return new NextResponse(generateErrorXml(), {
        status: 500,
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    }

    const xml = generateJobsFeedXML(vacancies || []);

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    return new NextResponse(generateErrorXml(), {
      status: 500,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  }
}

/**
 * Generate Google Jobs XML feed
 */
function generateJobsFeedXML(vacancies: any[]): string {
  const items = vacancies.map(v => generateJobItem(v)).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:jobs="http://jobs.google.com/rss/1.0"
     xmlns:gd="http://schemas.google.com/g/2005"
     xmlns:geo="http://www.w3.org/2003/01/geo/wgs84_pos#">
  <channel>
    <title>JobAISearch - Вакансии в России</title>
    <link>${siteUrl}</link>
    <description>Актуальные вакансии от работодателей России</description>
    <language>ru</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;
}

/**
 * Generate single job item for XML feed
 */
function generateJobItem(vacancy: any): string {
  // Sanitize all user input
  const sanitizedTitle = escapeXml(sanitizeString(vacancy.title));
  const sanitizedDescription = escapeXml(sanitizeString(vacancy.description || ""));
  const sanitizedCompany = escapeXml(sanitizeString(vacancy.company));
  const sanitizedCity = escapeXml(sanitizeString(vacancy.city));
  const sanitizedRequirements = vacancy.requirements
    ? escapeXml(sanitizeString(vacancy.requirements))
    : "";
  const sanitizedConditions = vacancy.conditions
    ? escapeXml(sanitizeString(vacancy.conditions))
    : "";

  // Calculate valid through date
  const publishedAt = vacancy.published_at || vacancy.created_at;
  const validThrough = vacancy.valid_through
    ? new Date(vacancy.valid_through).toISOString()
    : new Date(new Date(publishedAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // Employment type mapping
  const employmentTypes = mapEmploymentTypeXML(vacancy.employment_type, vacancy.schedule);

  return `<item>
    <title>${sanitizedTitle}</title>
    <link>${siteUrl}/vacancies/${vacancy.id}</link>
    <description>${sanitizedDescription}</description>
    <pubDate>${new Date(publishedAt).toUTCString()}</pubDate>
    <guid isPermaLink="true">${siteUrl}/vacancies/${vacancy.id}</guid>
    <jobs:posting>
      <jobs:title>${sanitizedTitle}</jobs:title>
      <jobs:description>${sanitizedDescription}</jobs:description>
      <jobs:identifier>
        <jobs:name>${escapeXml(sanitizedCompany)}</jobs:name>
        <jobs:value>${escapeXml(vacancy.id)}</jobs:value>
      </jobs:identifier>
      <jobs:datePosted>${new Date(publishedAt).toISOString()}</jobs:datePosted>
      <jobs:validThrough>${validThrough}</jobs:validThrough>
      <jobs:hiringOrganization>
        <jobs:name>${sanitizedCompany}</jobs:name>
        ${vacancy.company_url ? `<jobs:website>${escapeXml(vacancy.company_url)}</jobs:website>` : ""}
        ${vacancy.company_logo ? `<jobs:logo>${escapeXml(vacancy.company_logo)}</jobs:logo>` : ""}
      </jobs:hiringOrganization>
      <jobs:jobLocation>
        <jobs:address>
          <jobs:addressLocality>${sanitizedCity}</jobs:addressLocality>
          <jobs:addressCountry>RU</jobs:addressCountry>
        </jobs:address>
        ${vacancy.schedule === "remote" ? '<jobs:jobLocationType>TELECOMMUTE</jobs:jobLocationType>' : ""}
      </jobs:jobLocation>
      ${generateSalaryXML(vacancy)}
      ${employmentTypes}
      ${sanitizedRequirements ? `<jobs:responsibilities>${sanitizedRequirements}</jobs:responsibilities>` : ""}
      ${sanitizedConditions ? `<jobs:jobBenefits>${sanitizedConditions}</jobs:jobBenefits>` : ""}
      ${vacancy.skills && Array.isArray(vacancy.skills) && vacancy.skills.length > 0
        ? `<jobs:skills>${vacancy.skills.map((s: string) => `<jobs:skill>${escapeXml(sanitizeString(s))}</jobs:skill>`).join("")}</jobs:skills>`
        : ""}
      ${vacancy.work_hours ? `<jobs:workHours>${escapeXml(sanitizeString(vacancy.work_hours))}</jobs:workHours>` : ""}
      ${vacancy.experience && vacancy.experience !== "no_experience" && vacancy.experience !== "noexperience"
        ? `<jobs:experienceRequirements>${mapExperienceMonths(vacancy.experience)}</jobs:experienceRequirements>`
        : ""}
      <jobs:applicantLocationRequirements>
        <jobs:country>Russia</jobs:country>
      </jobs:applicantLocationRequirements>
    </jobs:posting>
  </item>`;
}

/**
 * Generate salary XML section
 */
function generateSalaryXML(vacancy: any): string {
  if (!vacancy.salary_from && !vacancy.salary_to) {
    return "";
  }

  let xml = "      <jobs:baseSalary>\n";
  xml += "        <jobs:currency>RUB</jobs:currency>\n";

  if (vacancy.salary_from) {
    xml += `        <jobs: minValue>${vacancy.salary_from}</jobs: minValue>\n`;
  }
  if (vacancy.salary_to) {
    xml += `        <jobs:maxValue>${vacancy.salary_to}</jobs:maxValue>\n`;
  }

  // Determine unit
  const avgSalary = (vacancy.salary_from || 0 + vacancy.salary_to || 0) /
    (vacancy.salary_from && vacancy.salary_to ? 2 : 1);
  const unit = avgSalary > 100000 ? "YEAR" : "MONTH";
  xml += `        <jobs:unit>${unit}</jobs:unit>\n`;
  xml += "      </jobs:baseSalary>\n";

  return xml;
}

/**
 * Map employment type to XML
 */
function mapEmploymentTypeXML(employment?: string, schedule?: string): string {
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

  // Remote work
  if (schedule === "remote" && types.length === 0) {
    types.push("FULL_TIME");
  }

  if (types.length === 0) {
    return "";
  }

  return "      <jobs:employmentType>" + types.join(", ") + "</jobs:employmentType>\n";
}

/**
 * Map experience to months
 */
function mapExperienceMonths(experience?: string): string {
  const expMap: Record<string, string> = {
    "no_experience": "0",
    "noexperience": "0",
    "1-3": "12",
    "between1and3": "12",
    "3-6": "36",
    "between3and6": "36",
    "6+": "72",
    "morethan6": "72",
  };

  return expMap[experience || ""] || "0";
}

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
 * Generate error XML response
 */
function generateErrorXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Error - JobAISearch Feed</title>
    <description>Error generating feed. Please try again later.</description>
  </channel>
</rss>`;
}
