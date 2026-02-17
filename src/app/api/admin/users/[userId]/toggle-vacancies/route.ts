import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromToken } from "@/lib/supabase-admin";

async function isAdmin(userId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single();
  return data?.role === "admin";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const adminId = await getUserFromToken(request);
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(adminId))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { userId } = await params;
    const supabase = getSupabaseAdmin();

    // Parse body for optional reason
    let reason = "";
    try {
      const body = await request.json();
      reason = body.reason || "";
    } catch {
      // No body is fine for simple toggle
    }

    // Get current state
    const { data: profile } = await supabase
      .from("profiles")
      .select("can_create_vacancies")
      .eq("user_id", userId)
      .single();

    const currentValue = profile?.can_create_vacancies ?? true;
    const newValue = !currentValue;

    // Update profile with ban status and reason
    const updateData: Record<string, unknown> = {
      can_create_vacancies: newValue,
    };

    if (!newValue) {
      // Banning: save reason
      updateData.vacancy_ban_reason = reason || "Нарушение правил публикации вакансий";
    } else {
      // Unbanning: clear reason
      updateData.vacancy_ban_reason = null;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("user_id", userId);

    if (profileError) {
      return NextResponse.json(
        { error: "Failed to toggle vacancies" },
        { status: 500 }
      );
    }

    // If banning: deactivate all active/published vacancies → move to draft
    if (!newValue) {
      const { data: deactivated, error: vacError } = await supabase
        .from("employer_vacancies")
        .update({
          status: "draft",
          is_active: false,
        })
        .eq("user_id", userId)
        .in("status", ["published", "pending_review", "active"])
        .select("id");

      if (vacError) {
      } else {
      }
    }

    return NextResponse.json({
      success: true,
      can_create_vacancies: newValue,
      reason: !newValue ? (reason || "Нарушение правил публикации вакансий") : null,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
