import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromToken } from "@/lib/supabase-admin";

async function isAdmin(userId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single();
  return data?.role === "admin";
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ settingId: string }> }
) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(userId))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { settingId } = await params;
    const body = await request.json();

    const supabase = getSupabaseAdmin();

    // Поддержка разных типов значений
    let value;
    if ("price" in body) {
      // Цена подписки
      value = {
        price: Math.min(999999, Math.max(1, body.price || 499)),
      };
    } else if ("count" in body) {
      // Количество дополнительных запросов
      value = {
        count: Math.min(1000, Math.max(1, body.count || 10)),
      };
    } else if ("discount_percent" in body) {
      // Числовой тип для скидки
      value = {
        enabled: body.enabled ?? true,
        discount_percent: Math.min(100, Math.max(0, body.discount_percent || 0)),
      };
    } else if ("enabled" in body) {
      // Булевый тип (старый формат)
      value = { enabled: body.enabled };
    } else {
      // Произвольный формат
      value = body.value || body;
    }

    const { error } = await supabase
      .from("site_settings")
      .update({
        value,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq("id", settingId);

    if (error) {
      console.error("[Update Setting] Error:", error);
      return NextResponse.json(
        { error: "Failed to update setting" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[Update Setting] Exception:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
