import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Секретный ключ для защиты cron endpoint
const CRON_SECRET = process.env.CRON_SECRET || "default-secret-change-in-production";

export async function POST(request: NextRequest) {
  try {
    // Проверяем авторизацию cron запроса
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Отменяем платежи в статусе pending старше 1 часа
    const { data: expiredPayments, error } = await supabase
      .from("payment_history")
      .select("id, yookassa_payment_id, user_id, created_at, metadata")
      .eq("status", "pending")
      .lt("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString()); // 1 час назад

    if (error) {
      return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
    }

    let cancelledCount = 0;

    // Обновляем каждый просроченный платеж
    for (const payment of expiredPayments || []) {
      const { error: updateError } = await supabase
        .from("payment_history")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
          metadata: {
            ...(payment.metadata || {}),
            reason: "auto_cancelled",
            message: "Payment expired after 1 hour"
          }
        })
        .eq("id", payment.id);

      if (!updateError) {
        cancelledCount++;
      }
    }


    return NextResponse.json({
      success: true,
      cancelled_count: cancelledCount,
      message: `Cancelled ${cancelledCount} expired pending payments`
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Также поддерживаем GET для простого тестирования (с тем же секретом в query param)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Создаём фейковый request для переиспользования логики POST
  const fakeRequest = new Request(request.url, {
    headers: {
      authorization: `Bearer ${CRON_SECRET}`
    }
  });

  // Вызываем POST логику
  return POST(fakeRequest as NextRequest);
}
