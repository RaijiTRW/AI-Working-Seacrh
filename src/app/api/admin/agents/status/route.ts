import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * GET /api/admin/agents/status
 * Proxy to Python backend agents status endpoint
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const url = new URL(req.url);
    const queryString = url.search; // Get query string including cache-buster

    const response = await fetch(`${BACKEND_URL}/api/admin/agents/status${queryString}`, {
      method: "GET",
      headers: {
        "Authorization": authHeader || "",
        "Content-Type": "application/json",
      },
      // Disable caching
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Agents Status] Backend error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to fetch agents status" },
        { status: response.status }
      );
    }

    const data = await response.json();
    // Disable response caching
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("[Agents Status] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
