import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("chat_quick_questions")
      .select("id, label, prompt, icon")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ questions: [] });
    }

    return NextResponse.json({ questions: data || [] });
  } catch (e) {
    return NextResponse.json({ questions: [] });
  }
}
