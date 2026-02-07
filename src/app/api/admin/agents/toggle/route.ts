import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * POST /api/admin/agents/toggle
 * Proxy to Python backend agents toggle endpoint
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
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Agents Toggle] Backend error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to toggle agent" },
        { status: response.status }
      );
    }

    const data = await response.json();
    // Disable caching
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[Agents Toggle] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
