import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

const MAX_FREE_GENERATIONS = 5;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { detail: "user_id required" },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Проверяем авторизацию
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { detail: "Не авторизован" },
        { status: 401 }
      );
    }

    // Считаем количество генераций из ai_usage_logs
    const { data: logs, error: countError } = await supabase
      .from("ai_usage_logs")
      .select("id")
      .eq("user_id", userId)
      .eq("field", "resume_generate");

    if (countError) {
      console.error("Count error:", countError);
      return NextResponse.json(
        { detail: "Ошибка при проверке лимита" },
        { status: 500 }
      );
    }

    const usedCount = logs?.length || 0;
    const remaining = Math.max(0, MAX_FREE_GENERATIONS - usedCount);

    return NextResponse.json({
      remaining,
      used: usedCount,
      max: MAX_FREE_GENERATIONS,
    });

  } catch (error) {
    console.error("Limit check error:", error);
    return NextResponse.json(
      { detail: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
