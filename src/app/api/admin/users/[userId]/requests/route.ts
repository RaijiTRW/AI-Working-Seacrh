import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/admin/users/[userId]/requests
 * Добавить бонусные запросы пользователю
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

    if (!amount || amount < 1) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Get current bonus_requests
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("bonus_requests")
      .eq("user_id", userId)
      .single();

    const currentBonus = targetProfile?.bonus_requests || 0;
    const newBonus = currentBonus + amount;

    // Update bonus_requests
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ bonus_requests: newBonus })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating bonus requests:", updateError);
      return NextResponse.json(
        { error: "Failed to add requests" },
        { status: 500 }
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
