"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { checkPaymentStatus, cancelPayment } from "@/lib/api";
import { supabase } from "@/lib/supabase";

interface ReceiptData {
  receipt_number: string;
  payment_id: string;
  date: string;
  customer: {
    name: string;
    email: string;
  };
  items: {
    name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
  vat: number;
  total: number;
  currency: string;
  payment_method: string;
  status: string;
}

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "pending" | "canceled" | "error">("loading");
  const [message, setMessage] = useState("");
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [checkCount, setCheckCount] = useState(0);
  const receiptRef = useRef<HTMLDivElement>(null);
  const paymentIdRef = useRef<string | null>(null);
  const statusRef = useRef<string>("loading");

  const paymentId = searchParams.get("payment_id");
  paymentIdRef.current = paymentId;

  // Обновляем ref при изменении статуса
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const handleCancel = useCallback(async () => {
    if (!paymentIdRef.current || canceling) return;

    setCanceling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setStatus("error");
        setMessage("Ошибка авторизации");
        return;
      }

      await cancelPayment(session.access_token, paymentIdRef.current);
      setStatus("canceled");
      setMessage("Платёж отменён");
    } catch (err) {
      // Всё равно показываем как отменённый
      setStatus("canceled");
      setMessage("Платёж отменён");
    } finally {
      setCanceling(false);
    }
  }, [canceling]);

  // Отмена при уходе со страницы
  useEffect(() => {
    const handleBeforeUnload = async () => {
      // Отменяем только если статус pending
      if (statusRef.current === "pending" && paymentIdRef.current) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          // Fire and forget - не ждём ответа
          fetch(`/api/subscription/cancel/${paymentIdRef.current}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            keepalive: true, // Важно для beforeunload
          }).catch(() => {});
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
      return;
    }

    if (!paymentId) {
      // Нет payment_id - значит платеж не был завершен (пользователь закрыл окно оплаты)
      setStatus("canceled");
      setMessage("Платёж не был завершён");
      return;
    }

    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    const checkStatus = async () => {
      if (!isMounted) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setStatus("error");
          setMessage("Ошибка авторизации");
          return;
        }

        const result = await checkPaymentStatus(session.access_token, paymentId);

        if (!isMounted) return;

        if (result.status === "succeeded") {
          setStatus("success");
          setMessage(
            result.type === "subscription"
              ? "Pro подписка успешно оформлена!"
              : "Запросы успешно добавлены!"
          );
          loadReceipt(session.access_token);
        } else if (result.status === "canceled") {
          setStatus("canceled");
          setMessage("Платёж был отменён");
        } else if (result.status === "pending" || result.status === "waiting_for_capture") {
          setStatus("pending");
          setMessage("Платёж обрабатывается...");
          setCheckCount(c => c + 1);

          // Продолжаем проверять только первые 20 раз (60 секунд)
          if (checkCount < 20) {
            timeoutId = setTimeout(checkStatus, 3000);
          }
        } else {
          setStatus("error");
          setMessage("Платёж не удался. Попробуйте ещё раз.");
        }
      } catch (err) {
        if (isMounted) {
          setStatus("error");
          setMessage("Ошибка проверки платежа");
        }
      }
    };

    const loadReceipt = async (token: string) => {
      setLoadingReceipt(true);
      try {
        const response = await fetch(`/api/subscription/receipt/${paymentId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            setReceipt(data);
          }
        }
      } catch (err) {
      } finally {
        if (isMounted) {
          setLoadingReceipt(false);
        }
      }
    };

    checkStatus();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user, authLoading, paymentId, router, checkCount]);

  const handlePrintReceipt = () => {
    if (!receiptRef.current) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Чек - ${receipt?.receipt_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px;
              max-width: 600px;
              margin: 0 auto;
            }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { font-size: 24px; color: #f97316; margin-bottom: 5px; }
            .header p { color: #666; font-size: 14px; }
            .receipt-number {
              background: #f3f4f6;
              padding: 10px 20px;
              border-radius: 8px;
              text-align: center;
              margin-bottom: 20px;
            }
            .section { margin-bottom: 20px; }
            .section-title {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
              margin-bottom: 8px;
            }
            .row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .row:last-child { border-bottom: none; }
            .total-row {
              font-weight: bold;
              font-size: 18px;
              background: #f9fafb;
              padding: 15px;
              border-radius: 8px;
              margin-top: 10px;
            }
            .status {
              display: inline-block;
              background: #dcfce7;
              color: #16a34a;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 500;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          ${receiptRef.current.innerHTML}
          <div class="footer">
            <p>Документ сформирован автоматически</p>
            <p>Job AI Search • jobaisearch.ru</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-6">
          {status === "loading" || status === "pending" ? (
            <>
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-orange-600 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                {status === "pending" ? "Ожидаем оплату..." : "Проверяем платёж..."}
              </h1>
              <p className="text-gray-600 mb-6">{message || "Пожалуйста, подождите"}</p>

              {/* Кнопка отмены для pending */}
              {status === "pending" && (
                <button
                  onClick={handleCancel}
                  disabled={canceling}
                  className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  {canceling ? "Отмена..." : "Отменить платёж"}
                </button>
              )}
            </>
          ) : status === "success" ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Оплата прошла успешно!
              </h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                <Link
                  href="/chat"
                  className="block w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors"
                >
                  Перейти к AI-поиску
                </Link>
                <Link
                  href="/profile"
                  className="block w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                >
                  Управление подпиской
                </Link>
              </div>
            </>
          ) : status === "canceled" ? (
            <>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Платёж отменён
              </h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                <Link
                  href="/subscription"
                  className="block w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors"
                >
                  Попробовать снова
                </Link>
                <Link
                  href="/"
                  className="block w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                >
                  На главную
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Что-то пошло не так
              </h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                <Link
                  href="/subscription"
                  className="block w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors"
                >
                  Попробовать снова
                </Link>
                <Link
                  href="/"
                  className="block w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                >
                  На главную
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Receipt Card */}
        {status === "success" && receipt && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Чек об оплате</h2>
              <button
                onClick={handlePrintReceipt}
                className="flex items-center gap-2 px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Распечатать
              </button>
            </div>

            <div ref={receiptRef}>
              <div className="header text-center mb-6">
                <h1 className="text-2xl font-bold text-orange-500 mb-1">Job AI Search</h1>
                <p className="text-gray-500 text-sm">Чек об оплате</p>
              </div>

              <div className="bg-gray-100 rounded-lg p-3 text-center mb-4">
                <span className="text-sm text-gray-500">Номер чека: </span>
                <span className="font-mono font-medium">{receipt.receipt_number}</span>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-2">Дата и время</p>
                  <p className="text-gray-900">{receipt.date}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase mb-2">Покупатель</p>
                  <p className="text-gray-900">{receipt.customer.email}</p>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs text-gray-500 uppercase mb-2">Товары/Услуги</p>
                  {receipt.items.map((item, i) => (
                    <div key={i} className="flex justify-between py-2">
                      <div>
                        <p className="text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.quantity} шт.</p>
                      </div>
                      <p className="font-medium text-gray-900">{item.total} ₽</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Способ оплаты</span>
                    <span className="text-gray-900">{receipt.payment_method}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Статус</span>
                    <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                      {receipt.status}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Итого</span>
                    <span className="text-2xl font-bold text-gray-900">{receipt.total} ₽</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {status === "success" && loadingReceipt && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Загрузка чека...</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccessContent />
    </Suspense>
  );
}
