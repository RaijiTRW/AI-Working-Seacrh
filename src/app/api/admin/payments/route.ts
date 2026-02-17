import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromToken } from "@/lib/supabase-admin";

type PaymentRow = {
  id: string;
  user_id: string;
  type: string;
  amount: number | string;
  currency: string | null;
  status: string;
  yookassa_payment_id: string | null;
  yookassa_status: string | null;
  payment_method_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type ProfileRow = {
  user_id: string;
  email: string | null;
  full_name: string | null;
};

async function isAdmin(userId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single();

  return data?.role === "admin";
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(userId))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "";

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("payment_history")
      .select(
        "id, user_id, type, amount, currency, status, yookassa_payment_id, yookassa_status, payment_method_id, metadata, created_at",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    if (type) {
      query = query.eq("type", type);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
    }

    const payments = (data || []) as PaymentRow[];
    const total = count || 0;
    const pages = Math.ceil(total / limit);

    const uniqueUserIds = Array.from(new Set(payments.map((payment) => payment.user_id).filter(Boolean)));

    let profilesMap = new Map<string, ProfileRow>();
    if (uniqueUserIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .in("user_id", uniqueUserIds);

      if (profilesError) {
        // Silently fail
      } else {
        profilesMap = new Map((profiles || []).map((profile) => [profile.user_id, profile as ProfileRow]));
      }
    }

    const formattedPayments = payments.map((payment) => {
      const profile = profilesMap.get(payment.user_id);
      return {
        ...payment,
        email: profile?.email || null,
        full_name: profile?.full_name || null,
      };
    });

    return NextResponse.json({
      payments: formattedPayments,
      total,
      page,
      pages,
    });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
