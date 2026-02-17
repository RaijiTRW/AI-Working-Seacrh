import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromToken } from "@/lib/supabase-admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentId } = await params;
    const supabase = getSupabaseAdmin();

    // Получаем данные платежа
    const { data: payment, error } = await supabase
      .from("payment_history")
      .select("*")
      .eq("yookassa_payment_id", paymentId)
      .eq("user_id", userId)
      .single();

    if (error || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status !== "succeeded") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    // Получаем данные пользователя
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("user_id", userId)
      .single();

    // Получаем email из auth.users если нет в profiles
    let userEmail = profile?.email;
    if (!userEmail) {
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      userEmail = authUser?.user?.email || "Не указан";
    }

    // Формируем данные чека
    const receiptData = {
      receipt_number: `RCP-${payment.id.slice(0, 8).toUpperCase()}`,
      payment_id: paymentId,
      date: new Date(payment.created_at).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      customer: {
        name: profile?.first_name && profile?.last_name
          ? `${profile.first_name} ${profile.last_name}`
          : userEmail,
        email: userEmail,
      },
      items: [
        {
          name: payment.type === "subscription"
            ? "Pro подписка на 1 месяц"
            : "Дополнительные запросы (10 шт)",
          quantity: 1,
          price: payment.amount,
          total: payment.amount,
        },
      ],
      subtotal: payment.amount,
      vat: 0, // НДС не облагается для ИП на УСН
      total: payment.amount,
      currency: payment.currency || "RUB",
      payment_method: "Банковская карта (YooKassa)",
      status: "Оплачено",
      company: {
        name: "Job AI Search",
        inn: "", // Будет заполнено при регистрации ИП/ООО
        address: "",
      },
    };

    return NextResponse.json(receiptData);
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
