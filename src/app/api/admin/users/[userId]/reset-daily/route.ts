import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/admin/users/[userId]/reset-daily
 * Сбросить использованные сегодня запросы (daily_used = 0)
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

    // First check if record exists
    const { data: existingRecord, error: checkError } = await supabase
      .from("user_request_limits")
      .select("user_id, daily_used, daily_limit")
      .eq("user_id", userId)
      .single();

    // If record doesn't exist, create it first
    if (checkError && checkError.code === 'PGRST116') {
      const { error: insertError } = await supabase
        .from("user_request_limits")
        .insert({
          user_id: userId,
          daily_limit: 15, // Default Pro Trial limit
          daily_used: 0,
          daily_reset_at: new Date().toISOString().split('T')[0],
          bonus_requests: 0,
        });

      if (insertError) {
        return NextResponse.json(
          { error: "Failed to create user request limits" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Created new record with daily_used = 0",
      });
    }

    if (checkError) {
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }


    // Reset daily_used to 0 - update the actual table, not the view
    const { data: updateData, error: updateError, count } = await supabase
      .from("user_request_limits")
      .update({ daily_used: 0, daily_reset_at: new Date().toISOString().split('T')[0] })
      .eq("user_id", userId)
      .select();


    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "Failed to reset daily usage" },
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
      message: "Daily usage reset to 0",
      previous_used: existingRecord?.daily_used,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
