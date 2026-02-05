import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/admin/users/[userId]/requests
 * Изменить бонусные запросы пользователю (добавить или уменьшить)
 * amount > 0 - добавить запросы
 * amount < 0 - убавить запросы
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Verify admin
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await params;
    const { amount } = await req.json();

    if (amount === undefined || amount === null || amount === 0) {
      return NextResponse.json(
        { error: "Invalid amount (cannot be 0)" },
        { status: 400 }
      );
    }

    // Get current bonus_requests from user_request_limits table
    const { data: targetLimits, error: checkError } = await supabase
      .from("user_request_limits")
      .select("bonus_requests")
      .eq("user_id", userId)
      .single();

    // If record doesn't exist, create it first
    if (checkError && checkError.code === 'PGRST116') {
      console.log("[Add Requests] Record doesn't exist, creating...");
      const newBonus = amount > 0 ? amount : 0; // Can't have negative bonus if creating new

      const { error: insertError } = await supabase
        .from("user_request_limits")
        .insert({
          user_id: userId,
          daily_limit: 15, // Default Pro Trial limit
          daily_used: 0,
          daily_reset_at: new Date().toISOString().split('T')[0],
          bonus_requests: newBonus,
        });

      if (insertError) {
        console.error("[Add Requests] Error creating record:", insertError);
        return NextResponse.json(
          { error: "Failed to create user request limits" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        new_bonus: newBonus,
      });
    }

    if (checkError) {
      console.error("[Add Requests] Error checking record:", checkError);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    console.log("[Add Requests] Current bonus_requests:", targetLimits?.bonus_requests);

    const currentBonus = targetLimits?.bonus_requests || 0;
    const newBonus = currentBonus + amount;

    // Проверка: не уйдём ли в отрицательные значения
    if (newBonus < 0) {
      return NextResponse.json(
        { error: `Cannot reduce below 0. Current bonus: ${currentBonus}` },
        { status: 400 }
      );
    }

    // Update bonus_requests in user_request_limits table
    const { data: updateData, error: updateError, count } = await supabase
      .from("user_request_limits")
      .update({ bonus_requests: newBonus })
      .eq("user_id", userId)
      .select();

    console.log("[Add Requests] Update result:", { data: updateData, error: updateError, count });

    if (updateError) {
      console.error("[Add Requests] Error updating bonus requests:", updateError);
      return NextResponse.json(
        { error: updateError.message || "Failed to add requests" },
        { status: 500 }
      );
    }

    // Check if update succeeded by verifying the data
    if (!updateData || updateData.length === 0) {
      return NextResponse.json(
        { error: "No rows were updated - user may not exist" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      new_bonus: newBonus,
    });
  } catch (error) {
    console.error("Error in add requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
