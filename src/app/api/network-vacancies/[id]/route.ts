import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sanitizeString } from "@/lib/sanitize";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Parse composite vacancy ID (format: "source_sourceId")
 * Examples: "hh_12345678", "avito_98765432", "superjob_11223344"
 */
function parseNetworkVacancyId(id: string): { source: string; sourceId: string } | null {
  const parts = id.split("_");
  if (parts.length < 2) return null;

  const source = parts[0];
  const sourceId = parts.slice(1).join("_"); // Rejoin in case source_id contains underscores

  // Validate source
  const validSources = ["hh", "avito", "superjob"];
  if (!validSources.includes(source)) return null;

  return { source, sourceId };
}

/**
 * GET /api/network-vacancies/[id] - Fetch network vacancy by composite ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Parse the composite ID
    const parsedId = parseNetworkVacancyId(id);
    if (!parsedId) {
      return NextResponse.json(
        { error: "Invalid vacancy ID format" },
        { status: 400 }
      );
    }

    const { source, sourceId } = parsedId;

    // Sanitize inputs
    const sanitizedSource = sanitizeString(source);
    const sanitizedSourceId = sanitizeString(sourceId);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch vacancy from vacancies_storage
    const { data: vacancy, error } = await supabase
      .from("vacancies_storage")
      .select("*")
      .eq("source", sanitizedSource)
      .eq("source_id", sanitizedSourceId)
      .eq("is_active", true)
      .eq("is_public", true)
      .single();

    if (error || !vacancy) {
      return NextResponse.json(
        { error: "Vacancy not found" },
        { status: 404 }
      );
    }

    // Transform vacancy data to match EmployerVacancy interface
    const transformedVacancy = {
      id: `${sanitizedSource}_${sanitizedSourceId}`,
      user_id: "", // Network vacancies don't have user_id
      title: vacancy.title,
      company: vacancy.company || "",
      city: vacancy.city || "",
      salary_from: vacancy.salary_from,
      salary_to: vacancy.salary_to,
      salary_currency: "RUB",
      experience: vacancy.experience,
      employment_type: vacancy.employment_type,
      schedule: null,
      description: vacancy.description || "",
      requirements: null,
      conditions: null,
      contact_name: null,
      contact_email: null,
      contact_phone: null,
      status: "published",
      is_active: vacancy.is_active,
      views_count: 0,
      responses_count: 0,
      created_at: vacancy.created_at,
      updated_at: vacancy.updated_at,
      published_at: vacancy.created_at,
      // Additional fields for network vacancies
      source: vacancy.source,
      source_id: vacancy.source_id,
      url: vacancy.url,
      is_network: true,
    };

    return NextResponse.json(transformedVacancy);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
