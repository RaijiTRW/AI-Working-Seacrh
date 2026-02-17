import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromToken } from "@/lib/supabase-admin";

// GET /api/conversations - Get user's conversations
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);

    if (!userId) {
      return NextResponse.json(
        { detail: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const offset = (page - 1) * limit;

    const supabase = getSupabaseAdmin();

    // Get conversations where user is applicant OR employer
    const { data: conversations, error, count } = await supabase
      .from("conversations")
      .select(`
        *,
        vacancy:employer_vacancies(id, title, company)
      `, { count: "exact" })
      .or(`applicant_id.eq.${userId},employer_id.eq.${userId}`)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { detail: error.message },
        { status: 400 }
      );
    }

    // Get applicant profiles and emails for all conversations
    const applicantIds = [...new Set((conversations || []).map(c => c.applicant_id))];

    // Get profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name, patronymic")
      .in("user_id", applicantIds);

    // Get emails from auth.users
    const { data: authUsers } = await supabase
      .from("auth.users")
      .select("id, email")
      .in("id", applicantIds);

    // If auth.users doesn't work (it's a system table), try getting from profiles or use a workaround
    // Actually, we need to get emails differently - let's store them when conversation is created
    // For now, let's try to get last message to show preview

    const profileMap = new Map(
      (profiles || []).map(p => [p.user_id, p])
    );

    // Format response
    const formattedConversations = (conversations || []).map((conv) => {
      const profile = profileMap.get(conv.applicant_id);
      const applicantName = profile
        ? [profile.last_name, profile.first_name, profile.patronymic].filter(Boolean).join(" ") || null
        : null;

      return {
        id: conv.id,
        vacancy_id: conv.vacancy_id,
        vacancy_title: conv.vacancy?.title || "Вакансия",
        vacancy_company: conv.vacancy?.company || "",
        applicant_id: conv.applicant_id,
        employer_id: conv.employer_id,
        applicant_name: applicantName,
        applicant_email: conv.applicant_email || null,
        status: conv.status,
        last_message_at: conv.last_message_at,
        applicant_unread_count: conv.applicant_unread_count || 0,
        employer_unread_count: conv.employer_unread_count || 0,
        created_at: conv.created_at,
      };
    });

    const total = count || 0;
    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      conversations: formattedConversations,
      total,
      page,
      pages,
    });
  } catch (err) {
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create or get existing conversation
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);

    if (!userId) {
      return NextResponse.json(
        { detail: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const vacancyId = body.vacancy_id;

    if (!vacancyId) {
      return NextResponse.json(
        { detail: "vacancy_id is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get vacancy to find employer
    const { data: vacancy, error: vacancyError } = await supabase
      .from("employer_vacancies")
      .select("id, user_id, title, company")
      .eq("id", vacancyId)
      .single();

    if (vacancyError || !vacancy) {
      return NextResponse.json(
        { detail: "Vacancy not found" },
        { status: 404 }
      );
    }

    // Check if user is trying to message themselves
    if (vacancy.user_id === userId) {
      return NextResponse.json(
        { detail: "Cannot create conversation with yourself" },
        { status: 400 }
      );
    }

    // Check if conversation already exists
    const { data: existingConv } = await supabase
      .from("conversations")
      .select("*")
      .eq("vacancy_id", vacancyId)
      .eq("applicant_id", userId)
      .single();

    if (existingConv) {
      return NextResponse.json({
        id: existingConv.id,
        vacancy_id: existingConv.vacancy_id,
        vacancy_title: vacancy.title,
        vacancy_company: vacancy.company,
        applicant_id: existingConv.applicant_id,
        employer_id: existingConv.employer_id,
        status: existingConv.status,
        last_message_at: existingConv.last_message_at,
        applicant_unread_count: existingConv.applicant_unread_count || 0,
        employer_unread_count: existingConv.employer_unread_count || 0,
        created_at: existingConv.created_at,
      });
    }

    // Get applicant email and profile
    const { data: { user: applicantUser } } = await supabase.auth.admin.getUserById(userId);
    const applicantEmail = applicantUser?.email || null;

    // Create new conversation
    const { data: newConv, error: createError } = await supabase
      .from("conversations")
      .insert({
        vacancy_id: vacancyId,
        applicant_id: userId,
        employer_id: vacancy.user_id,
        applicant_email: applicantEmail,
        status: "active",
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { detail: createError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      id: newConv.id,
      vacancy_id: newConv.vacancy_id,
      vacancy_title: vacancy.title,
      vacancy_company: vacancy.company,
      applicant_id: newConv.applicant_id,
      employer_id: newConv.employer_id,
      status: newConv.status,
      last_message_at: newConv.last_message_at,
      applicant_unread_count: 0,
      employer_unread_count: 0,
      created_at: newConv.created_at,
    });
  } catch (err) {
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 }
    );
  }
}
