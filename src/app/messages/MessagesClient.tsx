"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AppHeader from "@/components/app/Header";
import { supabase } from "@/lib/supabase";
import {
  getConversations,
  getMessages,
  sendConversationMessage,
  createConversation,
  Conversation,
  ConversationMessage,
} from "@/lib/api";

function formatTime(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  } else if (days === 1) {
    return "Вчера";
  } else if (days < 7) {
    return date.toLocaleDateString("ru-RU", { weekday: "short" });
  } else {
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  }
}

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vacancyId = searchParams.get("vacancy");

  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
        return;
      }
      setToken(session.access_token);
      setUserId(session.user.id);
    };
    checkAuth();
  }, [router]);

  // Load conversations
  useEffect(() => {
    if (token) {
      loadConversations();
    }
  }, [token]);

  // Create conversation if vacancy param is present
  useEffect(() => {
    if (token && vacancyId) {
      handleCreateConversation(vacancyId);
    }
  }, [token, vacancyId]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (token && activeConversation) {
      loadMessages(activeConversation.id);
    }
  }, [token, activeConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll for new messages and read status updates
  useEffect(() => {
    if (!token || !activeConversation) return;

    const pollMessages = async () => {
      try {
        const result = await getMessages(activeConversation.id, token);
        // Only update if there are changes (new messages or read status)
        const newMessages = result.messages.reverse();
        setMessages((prev) => {
          // Check if anything changed
          if (prev.length !== newMessages.length) return newMessages;
          const hasChanges = prev.some((msg, i) =>
            msg.is_read !== newMessages[i]?.is_read
          );
          return hasChanges ? newMessages : prev;
        });
      } catch (error) {
      }
    };

    // Poll every 5 seconds
    const interval = setInterval(pollMessages, 5000);
    return () => clearInterval(interval);
  }, [token, activeConversation]);

  const loadConversations = async () => {
    if (!token) return;
    try {
      const result = await getConversations(token);
      setConversations(result.conversations);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversation = async (vId: string) => {
    if (!token) return;
    try {
      // Strip "platform_" prefix if present
      const cleanId = vId.startsWith("platform_") ? vId.replace("platform_", "") : vId;
      const conversation = await createConversation(cleanId, token);
      setActiveConversation(conversation);
      await loadConversations();
      // Remove vacancy param from URL
      router.replace("/messages");
    } catch (error) {
      alert("Не удалось создать чат");
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (!token) return;
    try {
      const result = await getMessages(conversationId, token);
      // Reverse to show oldest first
      setMessages(result.messages.reverse());
      // Mark messages as read
      markAsRead(conversationId);
    } catch (error) {
    }
  };

  const markAsRead = async (conversationId: string) => {
    if (!token) return;
    try {
      await fetch(`/api/conversations/${conversationId}/read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Update local conversation unread count
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === conversationId) {
            return userId === c.applicant_id
              ? { ...c, applicant_unread_count: 0 }
              : { ...c, employer_unread_count: 0 };
          }
          return c;
        })
      );
    } catch (error) {
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !activeConversation || !newMessage.trim() || sending) return;

    setSending(true);
    try {
      const message = await sendConversationMessage(
        activeConversation.id,
        newMessage.trim(),
        token
      );
      setMessages((prev) => [...prev, message]);
      setNewMessage("");
      loadConversations(); // Update last message in list
    } catch (error) {
      alert("Не удалось отправить сообщение");
    } finally {
      setSending(false);
    }
  };

  const getUnreadCount = (conv: Conversation): number => {
    if (!userId) return 0;
    return userId === conv.applicant_id
      ? conv.applicant_unread_count
      : conv.employer_unread_count;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="pt-20 sm:pt-24 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="pt-20 sm:pt-24 h-screen">
        <div className="max-w-6xl mx-auto h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] flex">
          {/* Sidebar - conversation list */}
          <aside className={`${
            activeConversation ? "hidden md:flex" : "flex"
          } w-full md:w-80 bg-white border-r border-gray-200 flex-col`}>
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <h1 className="text-base sm:text-lg font-semibold text-gray-900">Сообщения</h1>
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-4 sm:p-6 text-center text-gray-500">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm">Нет сообщений</p>
                  <Link
                    href="/vacancies"
                    className="text-orange-500 hover:underline text-sm mt-2 inline-block"
                  >
                    Найти вакансию
                  </Link>
                </div>
              ) : (
                conversations.map((conv) => {
                  const unread = getUnreadCount(conv);
                  const isActive = activeConversation?.id === conv.id;
                  const isEmployer = userId === conv.employer_id;
                  // For employer: show applicant name/email, for applicant: show vacancy
                  const displayName = isEmployer
                    ? conv.applicant_name || conv.applicant_email || "Соискатель"
                    : conv.vacancy_title || "Вакансия";
                  const displaySubtitle = isEmployer
                    ? conv.vacancy_title
                    : conv.vacancy_company;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConversation(conv)}
                      className={`w-full p-3 sm:p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        isActive ? "bg-orange-50" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate text-sm sm:text-base">
                            {displayName}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">
                            {displaySubtitle}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs text-gray-400">
                            {formatTime(conv.last_message_at)}
                          </span>
                          {unread > 0 && (
                            <span className="w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                              {unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Chat area */}
          <div className={`${
            activeConversation ? "flex" : "hidden md:flex"
          } flex-1 flex-col bg-white`}>
            {activeConversation ? (
              <>
                {/* Chat header */}
                <div className="p-3 sm:p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between gap-2">
                    {/* Back button - mobile only */}
                    <button
                      onClick={() => setActiveConversation(null)}
                      className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div className="flex-1 min-w-0">
                      {userId === activeConversation.employer_id ? (
                        <>
                          <h2 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                            {activeConversation.applicant_name || activeConversation.applicant_email || "Соискатель"}
                          </h2>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">
                            {activeConversation.vacancy_title}
                          </p>
                        </>
                      ) : (
                        <>
                          <h2 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                            {activeConversation.vacancy_title}
                          </h2>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">
                            {activeConversation.vacancy_company}
                          </p>
                        </>
                      )}
                    </div>
                    <Link
                      href={`/vacancies/${activeConversation.vacancy_id}`}
                      className="text-xs sm:text-sm text-orange-500 hover:underline whitespace-nowrap"
                    >
                      <span className="hidden sm:inline">Открыть вакансию</span>
                      <span className="sm:hidden">Вакансия</span>
                    </Link>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8 sm:py-12">
                      <p className="text-sm sm:text-base">Начните диалог</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwn = message.sender_id === userId;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 sm:px-4 py-2 ${
                              isOwn
                                ? "bg-orange-500 text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            <p className="whitespace-pre-wrap text-sm sm:text-base">{message.content}</p>
                            <div className={`flex items-center justify-end gap-1 mt-1`}>
                              <span
                                className={`text-[10px] sm:text-xs ${
                                  isOwn ? "text-orange-100" : "text-gray-400"
                                }`}
                              >
                                {formatTime(message.created_at)}
                              </span>
                              {isOwn && (
                                <span className="text-orange-100">
                                  {message.is_read ? (
                                    // Double check - read
                                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                      <path d="M2 12l5 5L17 7" strokeLinecap="round" strokeLinejoin="round" />
                                      <path d="M7 12l5 5L22 7" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  ) : (
                                    // Single check - delivered
                                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                      <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message input */}
                <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Введите сообщение..."
                      className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="px-3 sm:px-5 py-2 sm:py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 p-4">
                <div className="text-center">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm sm:text-base">Выберите чат для просмотра сообщений</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
