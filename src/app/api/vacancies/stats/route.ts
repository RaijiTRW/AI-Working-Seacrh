import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { log } from "@/lib/logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

// GET /api/vacancies/stats - Получить статистику вакансий
export async function GET() {
  const supabase = getSupabaseAdmin();

  try {
    // Наши вакансии (platform) - опубликованные
    const { count: platformCount } = await supabase
      .from("employer_vacancies")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .eq("is_active", true);

    // Вакансии из сети (network) - активные
    const { count: networkCount } = await supabase
      .from("vacancies_storage")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true);

    const platform = platformCount || 0;
    const network = networkCount || 0;
    const total = platform + network;

    log.info(`[VacancyStats] Platform: ${platform}, Network: ${network}, Total: ${total}`);

    return NextResponse.json({
      platform,
      network,
      total,
    });
  } catch (error) {
    log.error("[VacancyStats] Error:", error);
    return NextResponse.json(
      {
        platform: 0,
        network: 0,
        total: 0,
      },
      { status: 500 }
    );
  }
}
