import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * POST /api/admin/support-chat/toggle
 * Включить/выключить Support Chat
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const body = await req.json();

    const response = await fetch(`${BACKEND_URL}/api/admin/agents/toggle`, {
      method: "POST",
      headers: {
        "Authorization": authHeader || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent_id: "support_chat",
        enabled: body.enabled,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Support Chat Toggle] Backend error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to toggle support chat" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[Support Chat Toggle] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
