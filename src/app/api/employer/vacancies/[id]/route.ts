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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update vacancy (owner only)
 */
export async function PUT(
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

    // Get authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Create Supabase client with service role key for bypassing RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user and get vacancy
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // Check if vacancy exists and belongs to user
    const { data: vacancy, error: fetchError } = await supabase
      .from("employer_vacancies")
      .select("user_id")
      .eq("id", sanitizedId)
      .single();

    if (fetchError || !vacancy) {
      return NextResponse.json(
        { error: "Vacancy not found" },
        { status: 404 }
      );
    }

    if (vacancy.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Get update data from request body
    const body = await request.json();

    // Update vacancy
    const { data: updatedVacancy, error: updateError } = await supabase
      .from("employer_vacancies")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sanitizedId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update vacancy" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedVacancy);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete vacancy (owner only)
 */
export async function DELETE(
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

    // Get authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Create Supabase client with service role key for bypassing RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // Check if vacancy exists and belongs to user
    const { data: vacancy } = await supabase
      .from("employer_vacancies")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!vacancy) {
      return NextResponse.json(
        { error: "Vacancy not found" },
        { status: 404 }
      );
    }

    if (vacancy.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Hard delete - physically remove from database
    const { error } = await supabase
      .from("employer_vacancies")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
