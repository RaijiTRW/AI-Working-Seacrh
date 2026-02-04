import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type LinkRow = {
  linked_email: string;
  linked_user_id: string;
  created_at: string;
};

function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

async function getUserFromAccessToken(accessToken: string): Promise<{ id: string; email: string } | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) return null;
  const email = (data.user.email || "").toLowerCase();
  if (!email) return null;
  return { id: data.user.id, email };
}

export async function GET(request: NextRequest) {
  try {
    const accessToken = getBearerToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await getUserFromAccessToken(accessToken);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("account_links")
      .select("linked_email, linked_user_id, created_at")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[AccountLinks][GET] Error:", error);
      return NextResponse.json({ linkedAccounts: [] }, { status: 200 });
    }

    const linkedAccounts = (data as LinkRow[] | null)?.map((row) => ({
      email: row.linked_email,
      userId: row.linked_user_id,
      addedAt: row.created_at,
    })) || [];

    return NextResponse.json({ linkedAccounts }, { status: 200 });
  } catch (e) {
    console.error("[AccountLinks][GET] Exception:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = getBearerToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await getUserFromAccessToken(accessToken);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as { otherAccessToken?: string } | null;
    const otherAccessToken = body?.otherAccessToken;
    if (!otherAccessToken) {
      return NextResponse.json({ error: "Missing otherAccessToken" }, { status: 400 });
    }

    const otherUser = await getUserFromAccessToken(otherAccessToken);
    if (!otherUser) {
      return NextResponse.json({ error: "Invalid otherAccessToken" }, { status: 400 });
    }

    if (currentUser.id === otherUser.id) {
      return NextResponse.json({ error: "Cannot link same account" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("account_links").upsert(
      [
        {
          user_id: currentUser.id,
          user_email: currentUser.email,
          linked_user_id: otherUser.id,
          linked_email: otherUser.email,
        },
        {
          user_id: otherUser.id,
          user_email: otherUser.email,
          linked_user_id: currentUser.id,
          linked_email: currentUser.email,
        },
      ],
      { onConflict: "user_id,linked_user_id" }
    );

    if (error) {
      console.error("[AccountLinks][POST] Error:", error);
      return NextResponse.json({ error: "Failed to save link" }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("[AccountLinks][POST] Exception:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const accessToken = getBearerToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await getUserFromAccessToken(accessToken);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as { linkedEmail?: string } | null;
    const linkedEmail = (body?.linkedEmail || "").toLowerCase().trim();
    if (!linkedEmail) {
      return NextResponse.json({ error: "Missing linkedEmail" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: linkRow, error: selectError } = await supabase
      .from("account_links")
      .select("linked_user_id, linked_email")
      .eq("user_id", currentUser.id)
      .eq("linked_email", linkedEmail)
      .maybeSingle();

    if (selectError) {
      console.error("[AccountLinks][DELETE] Select error:", selectError);
      return NextResponse.json({ error: "Failed to remove link" }, { status: 500 });
    }

    if (!linkRow?.linked_user_id) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const otherUserId = linkRow.linked_user_id as string;

    const { error: deleteError } = await supabase
      .from("account_links")
      .delete()
      .or(
        `and(user_id.eq.${currentUser.id},linked_user_id.eq.${otherUserId}),and(user_id.eq.${otherUserId},linked_user_id.eq.${currentUser.id})`
      );

    if (deleteError) {
      console.error("[AccountLinks][DELETE] Delete error:", deleteError);
      return NextResponse.json({ error: "Failed to remove link" }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("[AccountLinks][DELETE] Exception:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
