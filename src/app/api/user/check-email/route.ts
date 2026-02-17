import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromToken } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate current user
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get email from query params
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { available: false, message: "Invalid email" },
        { status: 400 }
      );
    }

    // 3. Check if email exists in auth.users
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      return NextResponse.json(
        { available: false, message: "Failed to check email" },
        { status: 500 }
      );
    }

    // 4. Check if email is taken (exclude current user's email)
    const emailTaken = data.users.some(
      (user) => user.email?.toLowerCase() === email.toLowerCase() && user.id !== userId
    );

    return NextResponse.json({
      available: !emailTaken,
      message: emailTaken ? "Этот email уже занят" : "Email доступен"
    });
  } catch (e) {
    return NextResponse.json(
      { available: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
