import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromToken } from "@/lib/supabase-admin";
import { log } from "@/lib/logger";

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

    // Проверяем - не истекло ли время ожидания платежа (более 1 часа)
    const { data: localPayment } = await supabase
      .from("payment_history")
      .select("*")
      .eq("yookassa_payment_id", paymentId)
      .single();

    // Если платеж есть в базе и он pending более 1 часа - отменяем его
    if (localPayment?.status === "pending") {
      const paymentAge = Date.now() - new Date(localPayment.created_at).getTime();
      const oneHour = 60 * 60 * 1000; // 1 час в миллисекундах

      if (paymentAge > oneHour) {
        // Автоматически отменяем просроченный платеж
        await supabase
          .from("payment_history")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
            metadata: {
              ...(localPayment.metadata || {}),
              reason: "auto_cancelled",
              message: "Payment expired after 1 hour"
            }
          })
          .eq("yookassa_payment_id", paymentId);

        return NextResponse.json({
          status: "failed",
          reason: "expired",
          message: "Платёж был отменён автоматически из-за истечения времени ожидания (1 час)"
        });
      }
    }

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

    // Если YooKassa вернул "canceled" - обновляем статус локально
    if (payment.status === "canceled") {
      await supabase
        .from("payment_history")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
          metadata: {
            reason: "yookassa_canceled",
            message: "Payment was canceled in YooKassa"
          }
        })
        .eq("yookassa_payment_id", paymentId);

      return NextResponse.json({
        status: "canceled",
        message: "Платёж был отменён"
      });
    }

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

      // Сохраняем payment_method_id для автосписания (если есть)
      if (payment.payment_method?.id) {
        await supabase
          .from("profiles")
          .update({
            yookassa_payment_method_id: payment.payment_method.id,
          })
          .eq("user_id", userId);

        log.info("[Check Payment] Saved payment_method_id for user:", { userId, paymentMethodId: payment.payment_method.id });
      }

      // Обрабатываем платеж
      if (paymentType === "subscription") {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        // Получаем цену из платежа (это то, что пользователь фактически заплатил)
        const purchasePrice = parseFloat(payment.amount.value);

        // Обновляем или создаем подписку с сохранением цены покупки
        await supabase
          .from("user_subscriptions")
          .upsert({
            user_id: userId,
            plan: "pro",
            status: "active",
            can_search_online: true,
            started_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            yookassa_payment_id: paymentId,
            purchase_price: purchasePrice,
          });

        // Обновляем лимиты
        await supabase
          .from("user_request_limits")
          .upsert({
            user_id: userId,
            daily_limit: 15,
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
        // Получаем количество дополнительных запросов из настроек
        const { data: countSetting } = await supabase
          .from("site_settings")
          .select("value")
          .eq("id", "extra_requests_count")
          .single();

        const extraRequestsCount = countSetting?.value?.count || 10;

        // Добавляем бонусные запросы
        const { data: currentLimits } = await supabase
          .from("user_request_limits")
          .select("bonus_requests")
          .eq("user_id", userId)
          .single();

        await supabase
          .from("user_request_limits")
          .update({
            bonus_requests: (currentLimits?.bonus_requests || 0) + extraRequestsCount,
          })
          .eq("user_id", userId);
      }

      // Обновляем статус платежа
      await supabase
        .from("payment_history")
        .update({
          status: "succeeded",
          payment_method_id: payment.payment_method?.id || null,
        })
        .eq("yookassa_payment_id", paymentId);

      return NextResponse.json({ status: "succeeded" });
    }

    return NextResponse.json({ status: payment.status });
  } catch (e) {
    log.error("[Check Payment] Exception:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
