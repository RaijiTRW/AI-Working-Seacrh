import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromToken } from "@/lib/supabase-admin";
import { checkIsAdmin } from "@/lib/api";

// Восстановление ошибочно отменённого платежа
// Только для админов
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Проверяем что это админ
    const isAdmin = await checkIsAdmin(request.headers.get("authorization")?.replace("Bearer ", "") || "");
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json({ error: "Missing paymentId" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Восстанавливаем платеж
    const { data, error } = await supabase
      .from("payment_history")
      .update({
        status: "pending",
        updated_at: new Date().toISOString(),
        // Убираем reason и message из metadata
      })
      .eq("id", paymentId)
      .eq("status", "failed")
      .select();

    if (error) {
      return NextResponse.json({ error: "Failed to restore payment" }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        error: "Payment not found or cannot be restored",
        hint: "Payment must be in 'failed' status with auto_cancelled reason"
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Payment restored successfully"
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Получить список отменённых платежей (для восстановления)
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await checkIsAdmin(request.headers.get("authorization")?.replace("Bearer ", "") || "");
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    // Получаем все auto_cancelled платежи
    const { data, error } = await supabase
      .from("payment_history")
      .select("id, yookassa_payment_id, user_id, amount, created_at, metadata")
      .eq("status", "failed")
      .filter("metadata->>reason", "eq", "auto_cancelled")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
    }

    return NextResponse.json({
      payments: data || [],
      count: data?.length || 0
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
