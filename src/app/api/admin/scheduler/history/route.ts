import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * GET /api/admin/scheduler/history?job_id=...&limit=...
 * Proxy to Python backend job history endpoint
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const { searchParams } = new URL(req.url);

    // Build query string for backend
    const queryString = searchParams.toString();

    const response = await fetch(`${BACKEND_URL}/api/admin/scheduler/history?${queryString}`, {
      method: "GET",
      headers: {
        "Authorization": authHeader || "",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Scheduler History] Backend error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to fetch job history" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Scheduler History] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
