import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromToken } from "@/lib/supabase-admin";

const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID;
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentId } = await params;

    if (!paymentId) {
      return NextResponse.json({ error: "Payment ID required" }, { status: 400 });
    }

    if (!YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY) {
      return NextResponse.json(
        { error: "Payment system not configured" },
        { status: 500 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Проверяем что платёж принадлежит пользователю
    const { data: payment } = await supabase
      .from("payment_history")
      .select("*")
      .eq("yookassa_payment_id", paymentId)
      .eq("user_id", userId)
      .single();

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Если уже не pending - нельзя отменить
    if (payment.status !== "pending") {
      return NextResponse.json({
        error: "Cannot cancel payment with status: " + payment.status,
        status: payment.status,
      }, { status: 400 });
    }

    // Пробуем отменить в YooKassa
    const cancelResponse = await fetch(
      `https://api.yookassa.ru/v3/payments/${paymentId}/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotence-Key": `cancel-${paymentId}-${Date.now()}`,
          Authorization: `Basic ${Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString("base64")}`,
        },
        body: JSON.stringify({}),
      }
    );

    let yookassaStatus = "unknown";

    if (cancelResponse.ok) {
      const canceledPayment = await cancelResponse.json();
      yookassaStatus = canceledPayment.status;
    } else {
      // Проверяем текущий статус в YooKassa
      const checkResponse = await fetch(
        `https://api.yookassa.ru/v3/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString("base64")}`,
          },
        }
      );

      if (checkResponse.ok) {
        const currentPayment = await checkResponse.json();
        yookassaStatus = currentPayment.status;
      }
    }

    // Обновляем статус в БД
    await supabase
      .from("payment_history")
      .update({
        status: "canceled",
        yookassa_status: yookassaStatus,
        metadata: {
          ...payment.metadata,
          canceled_at: new Date().toISOString(),
          canceled_by: "user",
        },
      })
      .eq("yookassa_payment_id", paymentId);

    return NextResponse.json({
      status: "canceled",
      message: "Payment canceled successfully",
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
