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

    // Получаем текущее состояние
    const { data: profile } = await supabase
      .from("profiles")
      .select("can_create_vacancies")
      .eq("user_id", userId)
      .single();

    const newValue = !(profile?.can_create_vacancies ?? true);

    const { error } = await supabase
      .from("profiles")
      .update({ can_create_vacancies: newValue })
      .eq("user_id", userId);

    if (error) {
      console.error("[Toggle Vacancies] Error:", error);
      return NextResponse.json(
        { error: "Failed to toggle vacancies" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, can_create_vacancies: newValue });
  } catch (e) {
    console.error("[Toggle Vacancies] Exception:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
