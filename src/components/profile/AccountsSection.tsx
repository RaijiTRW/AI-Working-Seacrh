"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface LinkedAccount {
  email: string;
  refreshToken: string;
  addedAt: string;
}

interface AccountsSectionProps {
  currentEmail: string;
  onLogout: () => void;
}

const LINKED_ACCOUNTS_KEY = "jobsearch_linked_accounts";

// Helper to get/set per-user linked accounts
function getUserLinkedAccounts(userEmail: string): LinkedAccount[] {
  try {
    const stored = localStorage.getItem(LINKED_ACCOUNTS_KEY);
    if (!stored) {
      console.log("[Accounts] No data in localStorage");
      return [];
    }
    const allAccounts: Record<string, LinkedAccount[]> = JSON.parse(stored);
    const normalizedEmail = userEmail.toLowerCase();
    const accounts = allAccounts[normalizedEmail] || [];
    console.log("[Accounts] getUserLinkedAccounts for", normalizedEmail, ":", accounts);
    return accounts;
  } catch (e) {
    console.error("[Accounts] Error reading localStorage:", e);
    return [];
  }
}

function setUserLinkedAccounts(userEmail: string, accounts: LinkedAccount[]) {
  try {
    const stored = localStorage.getItem(LINKED_ACCOUNTS_KEY);
    const allAccounts: Record<string, LinkedAccount[]> = stored ? JSON.parse(stored) : {};
    const normalizedEmail = userEmail.toLowerCase();

    if (accounts.length > 0) {
      allAccounts[normalizedEmail] = accounts;
    } else {
      delete allAccounts[normalizedEmail];
      // Also delete non-normalized version if exists
      delete allAccounts[userEmail];
    }

    if (Object.keys(allAccounts).length > 0) {
      localStorage.setItem(LINKED_ACCOUNTS_KEY, JSON.stringify(allAccounts));
      console.log("[Accounts] Saved to localStorage:", allAccounts);
    } else {
      localStorage.removeItem(LINKED_ACCOUNTS_KEY);
      console.log("[Accounts] Cleared localStorage");
    }
  } catch (e) {
    console.error("[Accounts] Error saving to localStorage:", e);
  }
}

export default function AccountsSection({ currentEmail, onLogout }: AccountsSectionProps) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);

  // Load linked accounts for current user and update tokens
  useEffect(() => {
    const initAccounts = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !currentEmail) return;

      // Get accounts linked to THIS user
      const accounts = getUserLinkedAccounts(currentEmail);
      console.log("[Accounts] Loaded for", currentEmail, ":", accounts);

      // Update refresh token for existing accounts if current user is in the list
      const existingIndex = accounts.findIndex(a => a.email.toLowerCase() === currentEmail.toLowerCase());
      if (existingIndex >= 0) {
        accounts[existingIndex] = {
          ...accounts[existingIndex],
          refreshToken: session.refresh_token || "",
        };
        setUserLinkedAccounts(currentEmail, accounts);
      }

      setLinkedAccounts(accounts);
    };

    initAccounts();
  }, [currentEmail]);

  const handleAddAccount = async () => {
    if (!email || !password) {
      setMessage({ type: "error", text: "Заполните все поля" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if already linked
    if (linkedAccounts.find(a => a.email.toLowerCase() === normalizedEmail)) {
      setMessage({ type: "error", text: "Этот аккаунт уже добавлен" });
      return;
    }

    // Check if trying to add current account
    if (currentEmail.toLowerCase() === normalizedEmail) {
      setMessage({ type: "error", text: "Это текущий аккаунт" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // First, save current account to linked list (so we can switch back)
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (!currentSession) {
        setMessage({ type: "error", text: "Сессия истекла" });
        setLoading(false);
        return;
      }

      // Build accounts list
      const currentAccountData: LinkedAccount = {
        email: currentEmail,
        refreshToken: currentSession.refresh_token || "",
        addedAt: new Date().toISOString(),
      };

      // Sign in with new account (this will sign out current)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login")) {
          setMessage({ type: "error", text: "Неверный email или пароль" });
        } else {
          setMessage({ type: "error", text: "Ошибка входа. Проверьте данные." });
        }
        setLoading(false);
        return;
      }

      // Add new account to linked list
      if (data.session) {
        const newEmail = (data.user?.email || normalizedEmail).toLowerCase();
        const newAccountData: LinkedAccount = {
          email: newEmail,
          refreshToken: data.session.refresh_token || "",
          addedAt: new Date().toISOString(),
        };

        // Update current account data with normalized email
        currentAccountData.email = currentEmail.toLowerCase();

        // Build final accounts list (both accounts)
        const finalAccounts = [currentAccountData, newAccountData];

        // Save to BOTH users' linked accounts (so both can switch to each other)
        setUserLinkedAccounts(currentAccountData.email, finalAccounts);
        setUserLinkedAccounts(newEmail, finalAccounts);

        console.log("[Accounts] Linked accounts saved:", {
          currentEmail: currentAccountData.email,
          newEmail: newEmail,
          accounts: finalAccounts,
        });
      }

      // Small delay to ensure localStorage is saved
      await new Promise(resolve => setTimeout(resolve, 100));

      // Redirect to chat
      router.push("/chat");
    } catch (err) {
      console.error("[Accounts] Error:", err);
      setMessage({ type: "error", text: "Ошибка входа. Проверьте данные." });
      setLoading(false);
    }
  };

  const handleSwitchAccount = async (account: LinkedAccount) => {
    if (account.email.toLowerCase() === currentEmail.toLowerCase()) return;

    setSwitchingTo(account.email);
    setMessage(null);

    try {
      // Use refresh token to restore session
      const { error } = await supabase.auth.refreshSession({
        refresh_token: account.refreshToken,
      });

      if (error) {
        // Token expired, need to re-login
        console.error("Session refresh failed:", error);
        setMessage({
          type: "error",
          text: "Сессия истекла. Удалите аккаунт и добавьте заново."
        });
        setSwitchingTo(null);
        return;
      }

      // Redirect to chat
      router.push("/chat");
    } catch (err) {
      console.error("Switch error:", err);
      setMessage({ type: "error", text: "Ошибка переключения" });
      setSwitchingTo(null);
    }
  };

  const handleRemoveAccount = (accountEmail: string) => {
    if (accountEmail.toLowerCase() === currentEmail.toLowerCase()) {
      setMessage({ type: "error", text: "Нельзя удалить текущий аккаунт" });
      return;
    }

    const updated = linkedAccounts.filter(a => a.email.toLowerCase() !== accountEmail.toLowerCase());
    setUserLinkedAccounts(currentEmail, updated);
    setLinkedAccounts(updated);
    setMessage({ type: "success", text: "Аккаунт удалён из списка" });
  };

  const handleGoogleLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } catch {
      setMessage({ type: "error", text: "Ошибка входа через Google" });
    }
  };

  // Other linked accounts (not current)
  const otherAccounts = linkedAccounts.filter(a => a.email.toLowerCase() !== currentEmail.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Current account */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Текущий аккаунт</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-semibold">
                {currentEmail[0]?.toUpperCase() || "?"}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{currentEmail}</p>
              <p className="text-sm text-green-600">Активный</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            Выйти
          </button>
        </div>
      </div>

      {/* Linked accounts + Add account */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Связанные аккаунты</h2>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              + Добавить
            </button>
          )}
        </div>

        {/* Other linked accounts */}
        {otherAccounts.length > 0 && (
          <div className="space-y-3 mb-4">
            {otherAccounts.map((account) => (
              <div
                key={account.email}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
              >
                <button
                  onClick={() => handleSwitchAccount(account)}
                  disabled={switchingTo === account.email}
                  className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-semibold">
                      {account.email[0]?.toUpperCase() || "?"}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{account.email}</p>
                    <p className="text-sm text-gray-500">
                      {switchingTo === account.email ? (
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                          Переключение...
                        </span>
                      ) : (
                        "Нажмите для переключения"
                      )}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => handleRemoveAccount(account.email)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Удалить из списка"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add account form */}
        {showAddForm ? (
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Войдите в другой аккаунт для мгновенного переключения
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Почта</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="example@mail.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="••••••••"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddAccount}
                disabled={loading}
                className="px-6 py-2 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {loading ? "Вход..." : "Добавить и войти"}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEmail("");
                  setPassword("");
                  setMessage(null);
                }}
                className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Отмена
              </button>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">или</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Войти через Google
            </button>
          </div>
        ) : otherAccounts.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">
            Нажмите "Добавить" чтобы связать другой аккаунт
          </p>
        ) : null}
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
