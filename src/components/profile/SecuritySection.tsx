"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface SecuritySectionProps {
  userEmail: string;
}

export default function SecuritySection({ userEmail }: SecuritySectionProps) {
  const [email, setEmail] = useState(userEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleEmailChange = async () => {
    if (!email || email === userEmail) return;

    setSavingEmail(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ email });

      if (error) throw error;
      setMessage({ type: "success", text: "Письмо для подтверждения отправлено на новую почту" });
    } catch (err) {
      setMessage({ type: "error", text: "Ошибка смены почты" });
    } finally {
      setSavingEmail(false);
    }
  };

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
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Новая почта</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="example@mail.com"
            />
          </div>
          <button
            onClick={handleEmailChange}
            disabled={savingEmail || email === userEmail}
            className="px-6 py-2 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {savingEmail ? "Сохранение..." : "Изменить почту"}
          </button>
        </div>
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
      {message && (
        <div className={`p-3 rounded-xl text-sm ${
          message.type === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
