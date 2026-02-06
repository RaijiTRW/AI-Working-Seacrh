import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromToken } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Удаляем сохранённый платёжный метод
    await supabase
      .from("profiles")
      .update({
        yookassa_payment_method_id: null,
      })
      .eq("user_id", userId);

    console.log("[Cancel Auto-renewal] Removed payment_method_id for user:", userId);

    return NextResponse.json({
      success: true,
      message: "Автопродление подписки отключено",
    });
  } catch (e) {
    console.error("[Cancel Auto-renewal] Exception:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
