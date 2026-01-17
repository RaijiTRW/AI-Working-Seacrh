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

    // Reset daily_used to 0
    const { error: updateError } = await supabase
      .from("user_subscription_status")
      .update({ daily_used: 0 })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error resetting daily_used:", updateError);
      return NextResponse.json(
        { error: "Failed to reset daily usage" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Daily usage reset to 0",
    });
  } catch (error) {
    console.error("Error in reset daily:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
