import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromToken } from "@/lib/supabase-admin";

const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID;
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY) {
      return NextResponse.json(
        { error: "Payment system not configured" },
        { status: 500 }
      );
    }

    const { paymentId } = await params;
    const supabase = getSupabaseAdmin();

    // Получаем статус платежа из YooKassa
    const response = await fetch(
      `https://api.yookassa.ru/v3/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString("base64")}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to check payment" },
        { status: 500 }
      );
    }

    const payment = await response.json();

    if (payment.status === "succeeded") {
      const paymentType = payment.metadata?.type;
      const paymentUserId = payment.metadata?.user_id;

      // Проверяем что платеж принадлежит пользователю
      if (paymentUserId !== userId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Проверяем не обработан ли уже платеж
      const { data: existingPayment } = await supabase
        .from("payment_history")
        .select("status")
        .eq("yookassa_payment_id", paymentId)
        .single();

      if (existingPayment?.status === "succeeded") {
        return NextResponse.json({
          status: "succeeded",
          already_processed: true,
        });
      }

      // Обрабатываем платеж
      if (paymentType === "subscription") {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        // Обновляем или создаем подписку
        await supabase
          .from("user_subscriptions")
          .upsert({
            user_id: userId,
            plan: "pro",
            status: "active",
            started_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
          });

        // Обновляем лимиты
        await supabase
          .from("user_request_limits")
          .upsert({
            user_id: userId,
            daily_limit: 10,
            daily_used: 0,
            daily_reset_at: new Date().toISOString().split("T")[0],
          });

        // Обновляем profiles для админки
        await supabase
          .from("profiles")
          .update({
            subscription_type: "pro",
            subscription_expires_at: expiresAt.toISOString(),
          })
          .eq("user_id", userId);
      } else if (paymentType === "extra_requests") {
        // Добавляем бонусные запросы
        const { data: currentLimits } = await supabase
          .from("user_request_limits")
          .select("bonus_requests")
          .eq("user_id", userId)
          .single();

        await supabase
          .from("user_request_limits")
          .update({
            bonus_requests: (currentLimits?.bonus_requests || 0) + 10,
          })
          .eq("user_id", userId);
      }

      // Обновляем статус платежа
      await supabase
        .from("payment_history")
        .update({ status: "succeeded" })
        .eq("yookassa_payment_id", paymentId);

      return NextResponse.json({ status: "succeeded" });
    }

    return NextResponse.json({ status: payment.status });
  } catch (e) {
    console.error("[Check Payment] Exception:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
