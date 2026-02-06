"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface SecuritySectionProps {
  userEmail: string;
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default function SecuritySection({ userEmail }: SecuritySectionProps) {
  // Email change states
  const [email, setEmail] = useState(userEmail);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isEmailAvailable, setIsEmailAvailable] = useState<boolean | null>(null);
  const [emailError, setEmailError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [newEmailSentTo, setNewEmailSentTo] = useState("");

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Email availability check with debounce
  const checkEmailAvailability = useCallback(
    debounce(async (emailToCheck: string) => {
      if (!emailToCheck || !emailToCheck.includes("@")) {
        setIsEmailAvailable(null);
        setEmailError("");
        return;
      }

      if (emailToCheck === userEmail) {
        setIsEmailAvailable(false);
        setEmailError("Введите новый email");
        return;
      }

      setIsCheckingEmail(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch(
          `/api/user/check-email?email=${encodeURIComponent(emailToCheck)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        setIsEmailAvailable(data.available);
        setEmailError(data.available ? "" : data.message);
      } catch {
        setIsEmailAvailable(false);
        setEmailError("Не удалось проверить email");
      } finally {
        setIsCheckingEmail(false);
      }
    }, 500),
    [userEmail]
  );

  // Initiate email change - отправляем письмо со ссылкой
  const handleInitiateEmailChange = async () => {
    if (!email || !isEmailAvailable) return;

    setSavingEmail(true);
    setMessage(null);

    try {
      // Supabase автоматически отправит письмо для подтверждения
      const { data, error } = await supabase.auth.updateUser({
        email,
      });

      if (error) {
        
        throw error;
      }

      setNewEmailSentTo(email);
      setEmailSent(true);
      setMessage({ type: "success", text: `Отправили письмо для подтверждения на ${email}` });
    } catch (err: any) {
      
      setMessage({ type: "error", text: err?.message || "Ошибка отправки письма" });
    } finally {
      setSavingEmail(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "Заполните все поля" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Пароли не совпадают" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Пароль должен быть не менее 6 символов" });
      return;
    }

    setSavingPassword(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;
      setMessage({ type: "success", text: "Пароль успешно изменён" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setMessage({ type: "error", text: "Ошибка смены пароля" });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Email change */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Изменить почту</h2>

        {!emailSent ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Новая почта</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  checkEmailAvailability(e.target.value);
                }}
                className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  emailError ? "border-red-500" : "border-gray-200"
                }`}
                placeholder="example@mail.com"
              />
              {isCheckingEmail && (
                <p className="text-sm text-gray-400 mt-1">Проверка...</p>
              )}
              {isEmailAvailable && !isCheckingEmail && (
                <p className="text-sm text-green-600 mt-1">Email доступен</p>
              )}
              {emailError && !isCheckingEmail && (
                <p className="text-sm text-red-500 mt-1">{emailError}</p>
              )}
            </div>
            <button
              onClick={handleInitiateEmailChange}
              disabled={savingEmail || !isEmailAvailable || email === userEmail}
              className="px-6 py-2 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {savingEmail ? "Отправка..." : "Изменить почту"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-800">
                Отправили письмо для подтверждения на <span className="font-medium">{newEmailSentTo}</span>
              </p>
              <p className="text-sm text-blue-600 mt-2">
                Перейдите по ссылке в письме для завершения смены email.
              </p>
            </div>
            <button
              onClick={() => {
                setEmailSent(false);
                setNewEmailSentTo("");
                setMessage(null);
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Отмена
            </button>
          </div>
        )}
      </div>

      {/* Password change */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Изменить пароль</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Текущий пароль</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Новый пароль</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Подтвердите пароль</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="••••••••"
            />
          </div>
          <button
            onClick={handlePasswordChange}
            disabled={savingPassword || !newPassword || !confirmPassword}
            className="px-6 py-2 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {savingPassword ? "Сохранение..." : "Изменить пароль"}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && !emailSent && (
        <div className={`p-3 rounded-xl text-sm ${
          message.type === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
