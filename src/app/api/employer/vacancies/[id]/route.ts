import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sanitizeString } from "@/lib/sanitize";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Vacancy ID is required" },
        { status: 400 }
      );
    }

    // Sanitize the ID to prevent injection
    const sanitizedId = sanitizeString(id);

    // Create Supabase client with service role key for bypassing RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch vacancy by ID with security filters
    const { data, error } = await supabase
      .from("employer_vacancies")
      .select("*")
      .eq("id", sanitizedId)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("[Employer Vacancy API] Error fetching vacancy:", error);

      // Check if it's a "not found" error
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Vacancy not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: "Failed to fetch vacancy" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Vacancy not found" },
        { status: 404 }
      );
    }

    // Check if vacancy is public and published
    if (data.status !== "published" || !data.is_public) {
      // Only show unpublished/private vacancies to the owner
      const authHeader = request.headers.get("authorization");
      if (!authHeader) {
        return NextResponse.json(
          { error: "Vacancy not found" },
          { status: 404 }
        );
      }

      // Verify user is the owner
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);

      if (!user || user.id !== data.user_id) {
        return NextResponse.json(
          { error: "Vacancy not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Employer Vacancy API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
