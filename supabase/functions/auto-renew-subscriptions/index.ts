import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const YOOKASSA_SHOP_ID = Deno.env.get("YOOKASSA_SHOP_ID");
const YOOKASSA_SECRET_KEY = Deno.env.get("YOOKASSA_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface Subscription {
  user_id: string;
  purchase_price: number;
  expires_at: string;
}

interface Profile {
  yookassa_payment_method_id: string;
}

serve(async (req) => {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = Deno.env.get("CRON_SECRET") || "auto-renew-secret";

    if (authHeader !== "Bearer " + cronSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY) {
      return new Response(JSON.stringify({ error: "YooKassa not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    const now = new Date();
    console.log("[Auto-renew] Starting at " + now.toISOString());

    // Find expired Pro subscriptions from last 12 hours
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString();

    const { data: expiredSubs, error: subsError } = await supabase
      .from("user_subscriptions")
      .select("user_id, purchase_price, expires_at")
      .eq("plan", "pro")
      .eq("status", "expired")
      .gte("expires_at", twelveHoursAgo)
      .order("expires_at", { ascending: true });

    if (subsError) {
      console.error("[Auto-renew] DB error:", subsError);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!expiredSubs || expiredSubs.length === 0) {
      console.log("[Auto-renew] No expired subs found");
      return new Response(JSON.stringify({
        success: true,
        processed: 0,
        message: "No expired subscriptions"
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("[Auto-renew] Found " + expiredSubs.length + " expired subscriptions");

    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    let downgraded = 0;
    const results: any[] = [];

    for (const sub of expiredSubs as Subscription[]) {
      processed++;
      const userId = sub.user_id;
      const purchasePrice = sub.purchase_price || 499;
      const expiresAt = new Date(sub.expires_at);
      const hoursSinceExpiry = (now.getTime() - expiresAt.getTime()) / (1000 * 60 * 60);

      // Get or create renewal attempt record
      const { data: existingAttempt } = await supabase
        .from("renewal_attempts")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      const retryCount = existingAttempt?.retry_count || 0;

      console.log("[Auto-renew] User: " + userId + ", expired: " + hoursSinceExpiry.toFixed(1) + "h ago, retries: " + retryCount);

      // Skip if less than 6 hours since expiry
      if (hoursSinceExpiry < 6) {
        console.log("[Auto-renew] Skipping " + userId + " - too soon");
        continue;
      }

      // After 2 failed attempts or 12 hours - downgrade to base
      if (retryCount >= 2 || hoursSinceExpiry >= 12) {
        console.log("[Auto-renew] Downgrading " + userId + " - max retries or 12h passed");
        await downgradeToBase(supabase, userId);
        downgraded++;
        results.push({ user_id: userId, success: false, action: "downgraded" });
        continue;
      }

      // Get payment method from profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("yookassa_payment_method_id")
        .eq("user_id", userId)
        .single();

      const paymentMethodId = (profile as unknown as Profile)?.yookassa_payment_method_id;

      if (!paymentMethodId) {
        console.log("[Auto-renew] Skipping " + userId + " - no payment method, will downgrade");
        await downgradeToBase(supabase, userId);
        downgraded++;
        results.push({ user_id: userId, success: false, action: "downgraded", error: "No payment method" });
        continue;
      }

      // Check if payment succeeded in last 6 hours
      const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
      const { data: recentPayment } = await supabase
        .from("payment_history")
        .select("status, created_at")
        .eq("user_id", userId)
        .eq("type", "subscription")
        .gte("created_at", sixHoursAgo)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentPayment?.status === "succeeded") {
        console.log("[Auto-renew] Skipping " + userId + " - recent success found");
        continue;
      }

      try {
        const idempotenceKey = "auto-renew-" + userId + "-" + Date.now();
        const authHeaderVal = "Basic " + btoa(YOOKASSA_SHOP_ID + ":" + YOOKASSA_SECRET_KEY);

        const paymentResponse = await fetch("https://api.yookassa.ru/v3/payments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotence-Key": idempotenceKey,
            "Authorization": authHeaderVal,
          },
          body: JSON.stringify({
            amount: {
              value: purchasePrice + ".00",
              currency: "RUB"
            },
            capture: true,
            payment_method_id: paymentMethodId,
            description: "Job AI Search - Auto-renewal Pro subscription (attempt " + (retryCount + 1) + ")",
            metadata: {
              user_id: userId,
              type: "subscription",
              auto_renewal: true,
              retry_attempt: retryCount + 1,
            },
          }),
        });

        if (!paymentResponse.ok) {
          const errorText = await paymentResponse.text();
          console.error("[Auto-renew] YooKassa error for " + userId + ":", errorText);
          await incrementRetries(supabase, userId, retryCount + 1);
          failed++;
          results.push({ user_id: userId, success: false, action: "payment_failed" });
          continue;
        }

        const payment = await paymentResponse.json();

        await supabase.from("payment_history").insert({
          user_id: userId,
          yookassa_payment_id: payment.id,
          yookassa_status: payment.status,
          amount: purchasePrice,
          currency: "RUB",
          type: "subscription",
          status: payment.status === "succeeded" ? "succeeded" : "pending",
          metadata: {
            description: "Auto-renewal subscription",
            retry_attempt: retryCount + 1,
            created_at: new Date().toISOString(),
            auto_renewal: true,
          },
        });

        if (payment.status === "succeeded") {
          const newExpiresAt = new Date();
          newExpiresAt.setMonth(newExpiresAt.getMonth() + 1);

          await supabase
            .from("user_subscriptions")
            .update({
              status: "active",
              can_search_online: true,
              expires_at: newExpiresAt.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          await supabase.from("renewal_attempts").delete().eq("user_id", userId);

          console.log("[Auto-renew] SUCCESS for user: " + userId);
          succeeded++;
          results.push({ user_id: userId, success: true, action: "renewed" });
        } else if (payment.status === "pending") {
          console.log("[Auto-renew] PENDING for user: " + userId);
          succeeded++;
          results.push({ user_id: userId, success: true, action: "pending" });
        } else {
          console.error("[Auto-renew] FAILED for user: " + userId + ", status: " + payment.status);
          await incrementRetries(supabase, userId, retryCount + 1);
          failed++;
          results.push({ user_id: userId, success: false, action: "payment_failed", error: "Payment " + payment.status });
        }
      } catch (err) {
        console.error("[Auto-renew] Exception for user " + userId + ":", err);
        await incrementRetries(supabase, userId, retryCount + 1);
        failed++;
        results.push({ user_id: userId, success: false, action: "exception", error: "Exception" });
      }
    }

    console.log("[Auto-renew] Completed: processed=" + processed + ", succeeded=" + succeeded + ", failed=" + failed + ", downgraded=" + downgraded);

    return new Response(JSON.stringify({
      success: true,
      processed,
      succeeded,
      failed,
      downgraded,
      results,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[Auto-renew] Exception:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

async function downgradeToBase(supabase: any, userId: string) {
  await supabase
    .from("user_subscriptions")
    .update({
      plan: "base",
      status: "active",
      expires_at: "2099-12-31T00:00:00Z",
      can_search_online: false,
      previous_plan: "pro",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  await supabase
    .from("user_request_limits")
    .update({
      daily_limit: 3,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  await supabase.from("renewal_attempts").delete().eq("user_id", userId);
}

async function incrementRetries(supabase: any, userId: string, newCount: number) {
  await supabase.from("renewal_attempts").upsert({
    user_id: userId,
    retry_count: newCount,
    last_attempt_at: new Date().toISOString(),
  }, {
    onConflict: "user_id",
  });
}
