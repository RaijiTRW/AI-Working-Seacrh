import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * GET /api/chat/preferences/[userId]
 * Proxy to Python backend get preferences endpoint
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const url = new URL(req.url);
    const chatId = url.searchParams.get("chat_id");

    let backendUrl = `${BACKEND_URL}/api/chat/preferences/${userId}`;
    if (chatId) {
      backendUrl += `?chat_id=${chatId}`;
    }

    const response = await fetch(backendUrl, { cache: "no-store" });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: "Failed to get preferences" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
