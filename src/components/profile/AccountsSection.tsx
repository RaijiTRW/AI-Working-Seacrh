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
const PENDING_GOOGLE_LINK_KEY = "jobsearch_pending_google_link";

async function fetchServerLinkedAccounts(accessToken: string): Promise<Array<{ email: string; addedAt: string }>> {
  const response = await fetch("/api/account-links", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) return [];
  const data = (await response.json().catch(() => null)) as
    | { linkedAccounts?: Array<{ email: string; addedAt: string }> }
    | null;

  return (data?.linkedAccounts || [])
    .filter((a) => a?.email)
    .map((a) => ({
      email: a.email.toLowerCase(),
      addedAt: a.addedAt,
    }));
}

async function saveServerLink(currentAccessToken: string, otherAccessToken: string): Promise<boolean> {
  const response = await fetch("/api/account-links", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${currentAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ otherAccessToken }),
  });

  return response.ok;
}

async function removeServerLink(currentAccessToken: string, linkedEmail: string): Promise<boolean> {
  const response = await fetch("/api/account-links", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${currentAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ linkedEmail }),
  });

  return response.ok;
}

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
    console.log("[Accounts] setUserLinkedAccounts - stored before:", stored);

    // Handle corrupted data: if stored is an array (old format), convert to object
    let allAccounts: Record<string, LinkedAccount[]> = {};
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        // Old/corrupted format - it's an array, clear it and start fresh
        console.log("[Accounts] WARNING: Found array in localStorage, converting to object format");
        allAccounts = {};
      } else if (typeof parsed === 'object' && parsed !== null) {
        allAccounts = parsed;
      }
    }

    const normalizedEmail = userEmail.toLowerCase();
    console.log("[Accounts] setUserLinkedAccounts - normalizedEmail:", normalizedEmail, "accounts:", accounts.length);

    if (accounts.length > 0) {
      allAccounts[normalizedEmail] = accounts;
    } else {
      delete allAccounts[normalizedEmail];
      // Also delete non-normalized version if exists
      delete allAccounts[userEmail];
    }

    console.log("[Accounts] setUserLinkedAccounts - allAccounts keys:", Object.keys(allAccounts));

    if (Object.keys(allAccounts).length > 0) {
      const jsonStr = JSON.stringify(allAccounts);
      localStorage.setItem(LINKED_ACCOUNTS_KEY, jsonStr);
      console.log("[Accounts] Saved to localStorage:", jsonStr);
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

  // Load linked accounts for current user and complete pending Google link
  useEffect(() => {
    const initAccounts = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const normalizedCurrentEmail = currentEmail.toLowerCase().trim();
      if (!session || !normalizedCurrentEmail) return;

      // Check for pending Google link (returning from OAuth)
      const pendingRaw = localStorage.getItem(PENDING_GOOGLE_LINK_KEY);
      if (pendingRaw) {
        try {
          const pending = JSON.parse(pendingRaw);
          // Only process if less than 5 minutes old
          if (Date.now() - pending.timestamp < 5 * 60 * 1000) {
            const previousEmail = pending.email.toLowerCase();
            const newEmail = normalizedCurrentEmail;

            if (previousEmail !== newEmail) {
              // Complete linking: save both accounts
              const previousAccount: LinkedAccount = {
                email: previousEmail,
                refreshToken: pending.refreshToken,
                addedAt: new Date().toISOString(),
              };
              const newAccount: LinkedAccount = {
                email: newEmail,
                refreshToken: session.refresh_token || "",
                addedAt: new Date().toISOString(),
              };

              const finalAccounts = [previousAccount, newAccount];

              // Save for BOTH emails
              setUserLinkedAccounts(previousEmail, finalAccounts);
              setUserLinkedAccounts(newEmail, finalAccounts);

              // Persist server-side (so link is visible even after logout / on other devices)
              const saved = pending.accessToken
                ? await saveServerLink(session.access_token, pending.accessToken)
                : false;

              setMessage({
                type: saved ? "success" : "error",
                text: saved
                  ? `Аккаунты связаны: ${previousEmail} ↔ ${newEmail}`
                  : "Аккаунты связаны локально, но не удалось сохранить связь на сервере",
              });
            }
          }
        } catch (e) {
          console.error("[Accounts] Error processing pending link:", e);
        }
        localStorage.removeItem(PENDING_GOOGLE_LINK_KEY);
        return;
      }

      const localAccounts = getUserLinkedAccounts(normalizedCurrentEmail);

      // Update refresh token for existing accounts if current user is in the list
      const existingIndex = localAccounts.findIndex((a) => a.email.toLowerCase() === normalizedCurrentEmail);
      if (existingIndex >= 0) {
        localAccounts[existingIndex] = {
          ...localAccounts[existingIndex],
          refreshToken: session.refresh_token || "",
        };
        setUserLinkedAccounts(normalizedCurrentEmail, localAccounts);
      }

      // Load persisted links from server and merge with local tokens (if available)
      const serverLinks = await fetchServerLinkedAccounts(session.access_token);
      const localByEmail = new Map(localAccounts.map((a) => [a.email.toLowerCase(), a]));
      const serverSet = new Set(serverLinks.map((a) => a.email.toLowerCase()));

      const merged: LinkedAccount[] = [
        {
          email: normalizedCurrentEmail,
          refreshToken: session.refresh_token || "",
          addedAt: new Date().toISOString(),
        },
        ...serverLinks
          .filter((a) => a.email.toLowerCase() !== normalizedCurrentEmail)
          .map((a) => ({
            email: a.email.toLowerCase(),
            refreshToken: localByEmail.get(a.email.toLowerCase())?.refreshToken || "",
            addedAt: a.addedAt,
          })),
      ];

      // Keep any local-only links (older behavior) visible too
      for (const acc of localAccounts) {
        const emailNorm = acc.email.toLowerCase();
        if (emailNorm === normalizedCurrentEmail) continue;
        if (serverSet.has(emailNorm)) continue;
        merged.push({ ...acc, email: emailNorm });
      }

      // Dedupe by email
      const seen = new Set<string>();
      const deduped = merged.filter((a) => {
        const emailNorm = a.email.toLowerCase();
        if (seen.has(emailNorm)) return false;
        seen.add(emailNorm);
        return true;
      });

      setLinkedAccounts(deduped);
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

      const previousAccessToken = currentSession.access_token;

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

        // Save to BOTH users' linked accounts (local switching tokens)
        setUserLinkedAccounts(currentAccountData.email, finalAccounts);
        setUserLinkedAccounts(newEmail, finalAccounts);

        // Persist server-side (so link is visible even after logout / on other devices)
        const saved = await saveServerLink(data.session.access_token, previousAccessToken);
        if (!saved) {
          setMessage({
            type: "error",
            text: "Аккаунт добавлен локально, но не удалось сохранить связь на сервере",
          });
        }
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
      if (!account.refreshToken) {
        sessionStorage.setItem("switch_to_email", account.email);
        router.push("/auth?switch=true");
        return;
      }

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

    const remove = async () => {
      const normalizedCurrentEmail = currentEmail.toLowerCase().trim();
      const updated = linkedAccounts.filter((a) => a.email.toLowerCase() !== accountEmail.toLowerCase());

      // Best-effort: remove persisted link
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await removeServerLink(session.access_token, accountEmail).catch(() => null);
      }

      // Remove local switching token cache
      setUserLinkedAccounts(normalizedCurrentEmail, updated);
      setLinkedAccounts(updated);
      setMessage({ type: "success", text: "Аккаунт удалён из списка" });
    };

    void remove();
  };

  const handleGoogleLogin = async () => {
    try {
      // Save current account before redirect so we can link after return
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession && currentEmail) {
        const pendingLink = {
          email: currentEmail.toLowerCase(),
          refreshToken: currentSession.refresh_token || "",
          accessToken: currentSession.access_token || "",
          timestamp: Date.now(),
        };
        localStorage.setItem(PENDING_GOOGLE_LINK_KEY, JSON.stringify(pendingLink));
      }

      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/profile?tab=accounts")}`,
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
