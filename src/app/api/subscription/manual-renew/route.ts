import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromToken } from "@/lib/supabase-admin";
import { log } from "@/lib/logger";

const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID;
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY;

// POST /api/subscription/manual-renew - Trigger manual renewal attempt
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Check if user has an expired Pro subscription
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!subscription || subscription.plan !== "pro" || subscription.status !== "expired") {
      return NextResponse.json({ error: "No expired Pro subscription found" }, { status: 400 });
    }

    // Check for saved payment method
    const { data: profile } = await supabase
      .from("profiles")
      .select("yookassa_payment_method_id")
      .eq("user_id", userId)
      .single();

    const paymentMethodId = profile?.yookassa_payment_method_id;

    if (!paymentMethodId) {
      return NextResponse.json({
        error: "No payment method found. Please complete checkout first.",
        needs_payment_method: true
      }, { status: 400 });
    }

    const purchasePrice = subscription.purchase_price || 499;

    // Create payment in YooKassa
    const idempotenceKey = `manual-renew-${userId}-${Date.now()}`;
    const authHeader = `Basic ${Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString("base64")}`;

    const paymentResponse = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotence-Key": idempotenceKey,
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        amount: {
          value: `${purchasePrice}.00`,
          currency: "RUB"
        },
        capture: true,
        payment_method_id: paymentMethodId,
        description: `Job AI Search — Ручное продление Pro подписки`,
        metadata: {
          user_id: userId,
          type: "subscription",
          manual_renewal: true,
        },
      }),
    });

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      log.error("[Manual Renew] YooKassa error:", errorText);
      return NextResponse.json({
        error: "Payment failed",
        details: errorText
      }, { status: 500 });
    }

    const payment = await paymentResponse.json();

    // Save payment record
    await supabase.from("payment_history").insert({
      user_id: userId,
      yookassa_payment_id: payment.id,
      yookassa_status: payment.status,
      amount: purchasePrice,
      currency: "RUB",
      type: "subscription",
      status: payment.status === "succeeded" ? "succeeded" : "pending",
      metadata: {
        description: "Ручное продление подписки",
        manual_renewal: true,
      },
    });

    if (payment.status === "succeeded") {
      // Extend subscription
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      await supabase
        .from("user_subscriptions")
        .update({
          status: "active",
          can_search_online: true,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      // Clear retry attempts
      await supabase.from("renewal_attempts").delete().eq("user_id", userId);

      log.subscription(`Manual renew SUCCESS for user: ${userId}`);
      return NextResponse.json({
        success: true,
        status: "succeeded",
        new_expires_at: expiresAt.toISOString()
      });
    } else if (payment.status === "pending") {
      log.subscription(`Manual renew PENDING for user: ${userId}`);
      return NextResponse.json({
        success: true,
        status: "pending",
        message: "Payment is being processed"
      });
    } else {
      // Increment retry count
      const { data: existingAttempt } = await supabase
        .from("renewal_attempts")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      const retryCount = (existingAttempt?.retry_count || 0) + 1;

      await supabase.from("renewal_attempts").upsert({
        user_id: userId,
        retry_count: retryCount,
        last_attempt_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      });

      log.subscription(`Manual renew FAILED for user: ${userId}, status: ${payment.status}`);
      return NextResponse.json({
        success: false,
        status: payment.status,
        retry_attempt: retryCount,
        max_retries: 2
      });
    }
  } catch (e) {
    log.error("[Manual Renew] Exception:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
