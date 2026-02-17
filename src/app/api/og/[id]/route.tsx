import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sanitizeString } from "@/lib/sanitize";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jobaisearch.ru";

/**
 * Parse vacancy ID to determine type
 * Format: "platform_uuid" or "source_sourceId"
 */
function parseVacancyId(id: string): { type: "platform" | "network"; id: string } | null {
  if (id.startsWith("platform_")) {
    return { type: "platform", id: id.replace("platform_", "") };
  }

  const parts = id.split("_");
  if (parts.length >= 2) {
    const source = parts[0];
    if (["hh", "avito", "superjob"].includes(source)) {
      return { type: "network", id };
    }
  }

  // Try as platform UUID
  return { type: "platform", id };
}

/**
 * Fetch platform vacancy
 */
async function getPlatformVacancy(id: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from("employer_vacancies")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .eq("is_active", true)
    .eq("is_public", true)
    .single();

  if (error || !data) return null;

  return {
    ...data,
    source: "platform",
    sourceLabel: "JobAISearch",
  };
}

/**
 * Fetch network vacancy
 */
async function getNetworkVacancy(id: string) {
  const parts = id.split("_");
  const source = parts[0];
  const sourceId = parts.slice(1).join("_");

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from("vacancies_storage")
    .select("*")
    .eq("source", source)
    .eq("source_id", sourceId)
    .eq("is_active", true)
    .eq("is_public", true)
    .single();

  if (error || !data) return null;

  const sourceLabels: Record<string, string> = {
    hh: "hh.ru",
    avito: "Avito",
    superjob: "SuperJob",
  };

  return {
    ...data,
    source: data.source,
    sourceLabel: sourceLabels[data.source] || data.source,
  };
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
 * Truncate text to fit in image
 */
function truncateText(text: string, maxLength: number): string {
  const cleanText = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (cleanText.length <= maxLength) return cleanText;
  return cleanText.slice(0, maxLength - 3).trim() + "...";
}

/**
 * Get source badge colors
 */
function getSourceBadgeColors(source: string): { bg: string; text: string } {
  const colors: Record<string, { bg: string; text: string }> = {
    hh: { bg: "#D6001C", text: "#FFFFFF" },
    avito: { bg: "#002FBB", text: "#FFFFFF" },
    superjob: { bg: "#FF7A00", text: "#FFFFFF" },
    platform: { bg: "#F97316", text: "#FFFFFF" },
  };
  return colors[source] || colors.platform;
}

/**
 * GET /api/og/[id] - Generate dynamic OG image for vacancy
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Parse vacancy ID
    const parsed = parseVacancyId(id);
    if (!parsed) {
      return new Response("Invalid vacancy ID", { status: 400 });
    }

    // Fetch vacancy data
    let vacancy: any = null;

    if (parsed.type === "platform") {
      vacancy = await getPlatformVacancy(parsed.id);
    } else {
      vacancy = await getNetworkVacancy(parsed.id);
    }

    // Fallback to default OG image if vacancy not found
    if (!vacancy) {
      return new ImageResponse(
        (
          <div
            style={{
              height: "100%",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#fff",
              fontSize: 60,
              fontWeight: 700,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
              <span style={{ marginRight: 20, fontSize: 80 }}>💼</span>
              <span>JobAISearch</span>
            </div>
            <div style={{ fontSize: 40, color: "#666" }}>Вакансия не найдена</div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    // Sanitize data
    const title = truncateText(sanitizeString(vacancy.title), 50);
    const company = truncateText(sanitizeString(vacancy.company || ""), 40);
    const city = sanitizeString(vacancy.city || "");
    const salary = formatSalary(vacancy.salary_from, vacancy.salary_to);
    const sourceLabel = vacancy.sourceLabel || "JobAISearch";
    const badgeColors = getSourceBadgeColors(vacancy.source);

    // Generate OG image
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#fff",
            backgroundImage: "linear-gradient(180deg, #FFF7ED 0%, #FFFFFF 100%)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "40px 60px",
              borderBottom: "2px solid #FED7AA",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: 32,
                fontWeight: 700,
                color: "#F97316",
              }}
            >
              <span style={{ marginRight: 10 }}>💼</span>
              JobAISearch
            </div>
            <div
              style={{
                backgroundColor: badgeColors.bg,
                color: badgeColors.text,
                padding: "8px 20px",
                borderRadius: 8,
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              {sourceLabel}
            </div>
          </div>

          {/* Content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              flex: 1,
              padding: "60px",
            }}
          >
            {/* Title */}
            <div
              style={{
                fontSize: 56,
                fontWeight: 700,
                color: "#1F2937",
                marginBottom: 20,
                lineHeight: 1.2,
              }}
            >
              {title}
            </div>

            {/* Company */}
            <div
              style={{
                fontSize: 36,
                color: "#4B5563",
                marginBottom: 20,
                fontWeight: 500,
              }}
            >
              {company}
            </div>

            {/* Info Row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 30,
                marginTop: 20,
              }}
            >
              {/* Salary */}
              {salary && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#FEF3C7",
                    padding: "12px 24px",
                    borderRadius: 12,
                  }}
                >
                  <span style={{ fontSize: 28, marginRight: 8 }}>💰</span>
                  <span
                    style={{
                      fontSize: 32,
                      fontWeight: 600,
                      color: "#92400E",
                    }}
                  >
                    {salary}
                  </span>
                </div>
              )}

              {/* City */}
              {city && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#DBEAFE",
                    padding: "12px 24px",
                    borderRadius: 12,
                  }}
                >
                  <span style={{ fontSize: 28, marginRight: 8 }}>📍</span>
                  <span
                    style={{
                      fontSize: 32,
                      fontWeight: 600,
                      color: "#1E40AF",
                    }}
                  >
                    {city}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px 60px",
              borderTop: "1px solid #FED7AA",
              fontSize: 18,
              color: "#9CA3AF",
            }}
          >
            {siteUrl}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {

    // Return fallback image
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#fff",
            fontSize: 60,
            fontWeight: 700,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
            <span style={{ marginRight: 20, fontSize: 80 }}>💼</span>
            <span>JobAISearch</span>
          </div>
          <div style={{ fontSize: 40, color: "#666" }}>Найди работу мечты</div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}

// Configure caching with ISR
export const runtime = "edge";
export const revalidate = 3600; // Revalidate every hour
export const dynamic = "force-static";
