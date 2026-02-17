"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/lib/useAuth";
import { useSiteSettings } from "@/lib/useSiteSettings";
import { supabase } from "@/lib/supabase";

/**
 * Простой рендерер Markdown для чата
 */
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listKey = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="list-disc list-inside space-y-1 my-2">
          {listItems.map((item, i) => (
            <li key={i} className="text-sm">{formatInline(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  const formatInline = (line: string): React.ReactNode => {
    // Bold **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      // Links [text](url)
      const linkParts = part.split(/(\[[^\]]+\]\([^)]+\))/g);
      return linkParts.map((linkPart, j) => {
        const linkMatch = linkPart.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
          return (
            <a key={`${i}-${j}`} href={linkMatch[2]} target="_blank" rel="noopener noreferrer"
               className="text-orange-500 hover:underline">
              {linkMatch[1]}
            </a>
          );
        }
        return linkPart;
      });
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      flushList();
      continue;
    }

    // Headings
    if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(
        <h3 key={i} className="font-bold text-base mt-3 mb-1 flex items-center gap-2">
          {formatInline(trimmed.slice(2))}
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h4 key={i} className="font-semibold text-sm mt-2 mb-1 flex items-center gap-1">
          {formatInline(trimmed.slice(3))}
        </h4>
      );
      continue;
    }

    // List items
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      listItems.push(trimmed.slice(2));
      continue;
    }

    // Numbered list (1. 2. etc)
    if (/^\d+[.)]/.test(trimmed)) {
      listItems.push(trimmed.replace(/^\d+[.)]\s*/, ""));
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={i} className="text-sm my-1">{formatInline(trimmed)}</p>
    );
  }

  flushList();
  return elements;
}

interface QuickQuestion {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant" | "admin" | "system";
  content: string;
  created_at: string;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  is_support: boolean;
  status: "active" | "closed";
  last_message?: string;
}

type ViewMode = "home" | "chat" | "support";

export default function FloatingChat() {
  const { user, loading: authLoading } = useAuth();
  const { settings } = useSiteSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("home");
  const [quickQuestions, setQuickQuestions] = useState<QuickQuestion[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSupport, setIsSupport] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [supportStatus, setSupportStatus] = useState<"active" | "closed">("active");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Support Chat agent status
  const [supportChatEnabled, setSupportChatEnabled] = useState(true);

  // Состояние для скрытия чата на определенных страницах
  const [isVisible, setIsVisible] = useState(true);

  // Guest ID для неавторизованных пользователей
  const [guestId, setGuestId] = useState<string | null>(null);

  // Отслеживаем изменение pathname для скрытия/показа чата
  useEffect(() => {
    const checkVisibility = () => {
      if (typeof window === "undefined") return;

      const pathname = window.location.pathname;
      // Скрываем на авторизации, редакторе резюме и AI поиске
      const shouldHide = pathname.startsWith("/auth") || pathname === "/resume-builder" || pathname === "/chat";
      setIsVisible(!shouldHide);
    };

    checkVisibility();

    // Добавляем listener для навигации
    const handleRouteChange = () => {
      checkVisibility();
    };

    // Следим за изменениями в pathname (для Next.js app router)
    const originalPush = window.history.pushState;
    const originalReplace = window.history.replaceState;

    window.history.pushState = function(...args) {
      originalPush.apply(this, args);
      setTimeout(checkVisibility, 0);
    };

    window.history.replaceState = function(...args) {
      originalReplace.apply(this, args);
      setTimeout(checkVisibility, 0);
    };

    // Popstate handler (назад/вперёд)
    const handlePopState = () => checkVisibility();
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.history.pushState = originalPush;
      window.history.replaceState = originalReplace;
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Получение или генерация guest_id
  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      let id = localStorage.getItem('guest_id');
      if (!id) {
        // Генерируем уникальный guest_id
        id = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        localStorage.setItem('guest_id', id);
      }
      setGuestId(id);
    } else {
      setGuestId(null);
    }
  }, [user]);

  // Эффективный ID пользователя (user.id или guest_id)
  const effectiveUserId = user?.id || guestId;

  // Загрузка статуса Support Chat агента
  useEffect(() => {
    const fetchSupportChatStatus = async () => {
      try {
        const response = await fetch("/api/admin/support-chat/status");
        if (response.ok) {
          const data = await response.json();
          setSupportChatEnabled(data.enabled);
        }
      } catch (e) {
      }
    };

    fetchSupportChatStatus();
    // Проверяем каждые 30 секунд
    const interval = setInterval(fetchSupportChatStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Загрузка при открытии
  useEffect(() => {
    if (isOpen && (user || guestId)) {
      fetchQuickQuestions();
      fetchChatHistory();
    }
  }, [isOpen, user, guestId]);

  // Polling для support чата
  useEffect(() => {
    if (viewMode === "support" && isSupport && supportStatus === "active") {
      pollingRef.current = setInterval(fetchSupportMessages, 3000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [viewMode, isSupport, supportStatus, currentSessionId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const fetchQuickQuestions = async () => {
    try {
      const response = await fetch("/api/support/quick-questions");
      if (response.ok) {
        const data = await response.json();
        // Фильтруем кнопку связи с админом - она обрабатывается через AI
        setQuickQuestions(data.questions.filter((q: QuickQuestion) => q.prompt !== "ADMIN_CONTACT"));
      }
    } catch (e) {
    }
  };

  const fetchChatHistory = async () => {
    try {
      const sessions: ChatSession[] = [];

      // Получаем support чат
      const headers: Record<string, string> = {};
      const body = guestId ? JSON.stringify({ guest_id: guestId }) : undefined;

      if (user) {
        const token = await getToken();
        if (!token) return;
        headers["Authorization"] = `Bearer ${token}`;
      } else if (guestId) {
        headers["Content-Type"] = "application/json";
      }

      const supportResponse = await fetch("/api/support/my-chat", {
        method: guestId ? "POST" : "GET",
        headers,
        body,
      });

      if (supportResponse.ok) {
        const supportData = await supportResponse.json();
        if (supportData.chat) {
          sessions.push({
            id: supportData.chat.id,
            title: "Чат с поддержкой",
            created_at: supportData.chat.created_at,
            is_support: true,
            status: supportData.chat.status,
            last_message: supportData.messages?.[supportData.messages.length - 1]?.content?.slice(0, 50),
          });
        }
      }

      setChatSessions(sessions);
    } catch (e) {
    }
  };

  const fetchSupportMessages = async () => {
    if (!currentSessionId) return;
    try {
      const headers: Record<string, string> = {};
      const body = guestId ? JSON.stringify({ guest_id: guestId }) : undefined;

      if (user) {
        const token = await getToken();
        if (!token) return;
        headers["Authorization"] = `Bearer ${token}`;
      } else if (guestId) {
        headers["Content-Type"] = "application/json";
      }

      const response = await fetch("/api/support/my-chat", {
        method: guestId ? "POST" : "GET",
        headers,
        body,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.chat) {
          const prevStatus = supportStatus;
          const newStatus = data.chat.status;
          setSupportStatus(newStatus);

          // Загружаем сообщения
          const loadedMessages = data.messages.map((m: { id: string; sender_type: string; content: string; created_at: string }) => ({
            id: m.id,
            role: m.sender_type === "user" ? "user" : m.sender_type === "admin" ? "admin" : "assistant",
            content: m.content,
            created_at: m.created_at,
          }));

          // Если админ только что закрыл чат (в процессе polling)
          if (newStatus === "closed" && prevStatus === "active") {
            if (!data.chat.rating) {
              setShowRating(true);
            }
            // Добавляем системное сообщение о завершении
            const closedMsg: Message = {
              id: "closed-" + Date.now(),
              role: "system",
              content: "Администратор завершил диалог. Вы можете продолжить общение с AI-ассистентом.",
              created_at: new Date().toISOString(),
            };
            setMessages([...loadedMessages, closedMsg]);
          } else {
            setMessages(loadedMessages);
          }
        }
      }
    } catch (e) {
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setIsSupport(false);
    setShowRating(false);
    setSupportStatus("active");
    setViewMode("chat");
  };

  const openSession = async (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setIsSupport(session.is_support);
    setSupportStatus(session.status);

    if (session.is_support) {
      setViewMode("support");
      await fetchSupportMessages();
    } else {
      setViewMode("chat");
    }
  };

  const connectToAdmin = async () => {
    try {
      setIsLoading(true);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (user) {
        const token = await getToken();
        if (!token) return;
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Собираем историю AI-чата для передачи админу
      const previousMessages = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch("/api/support/contact-admin", {
        method: "POST",
        headers,
        body: JSON.stringify({
          previous_messages: previousMessages,
          guest_id: guestId || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentSessionId(data.chat_id);
        setIsSupport(true);
        setSupportStatus("active");
        setViewMode("support");
        // Загружаем сообщения из БД (включая сохранённую историю AI)
        await fetchSupportMessages();
      }
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");

    // Добавляем сообщение пользователя
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newUserMsg]);

    if (isSupport && supportStatus === "active") {
      await sendSupportMessage(userMessage);
    } else {
      await sendToAI(userMessage);
    }
  };

  const sendSupportMessage = async (message: string) => {
    try {
      setIsLoading(true);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const body: Record<string, string | null> = {
        chat_id: currentSessionId,
        message,
        guest_id: guestId || null,
      };

      if (user) {
        const token = await getToken();
        if (!token) return;
        headers["Authorization"] = `Bearer ${token}`;
      }

      await fetch("/api/support/send-message", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      await fetchSupportMessages();
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  };

  const sendToAI = async (message: string) => {
    try {
      setIsLoading(true);

      // Проверяем, включён ли чат
      if (!settings.chat_enabled) {
        const disabledMsg: Message = {
          id: Date.now().toString() + "-disabled",
          role: "system",
          content: "AI-чат поддержки временно недоступен. Пожалуйста, попробуйте позже.",
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, disabledMsg]);
        return;
      }

      // Собираем контекст из последних сообщений
      const context = messages.slice(-10).map(m =>
        `${m.role === "user" ? "Пользователь" : "Ассистент"}: ${m.content}`
      ).join("\n");

      // Вызываем Python backend
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/api/chat/support`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, context }),
      });

      if (response.ok) {
        const data = await response.json();

        // Проверяем, нужно ли связать с админом
        if (data.connect_to_admin) {
          const systemMsg: Message = {
            id: Date.now().toString() + "-sys",
            role: "system",
            content: "Соединяю вас с администратором...",
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, systemMsg]);
          await connectToAdmin();
        } else {
          const aiMsg: Message = {
            id: Date.now().toString() + "-ai",
            role: "assistant",
            content: data.response,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, aiMsg]);
        }
      }
    } catch (e) {
      const errorMsg: Message = {
        id: Date.now().toString() + "-err",
        role: "assistant",
        content: "Произошла ошибка. Попробуйте позже.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: QuickQuestion) => {
    setInputValue(question.label);
  };

  const submitRating = async (rating: number) => {
    try {
      const token = await getToken();
      if (!token || !currentSessionId) return;

      await fetch("/api/support/rate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ chat_id: currentSessionId, rating }),
      });

      setShowRating(false);
      // После оценки переключаемся обратно на AI режим
      switchToAIMode();
    } catch (e) {
    }
  };

  const skipRating = () => {
    setShowRating(false);
    switchToAIMode();
  };

  const switchToAIMode = () => {
    setIsSupport(false);
    setCurrentSessionId(null);
    setSupportStatus("active");
    setViewMode("chat");
    // Сохраняем сообщения - пользователь продолжает с того места где был
  };

  const goHome = () => {
    setViewMode("home");
    setMessages([]);
    setIsSupport(false);
    setCurrentSessionId(null);
    fetchChatHistory();
  };

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case "search":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
      case "sparkles":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
      case "document":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Сегодня";
    if (diffDays === 1) return "Вчера";
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  // Не показываем если агент выключен
  if (!supportChatEnabled) return null;
  // Не показываем если authLoading или скрыт
  if (authLoading || !isVisible) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
          isOpen ? "bg-gray-600 hover:bg-gray-700" : "bg-orange-500 hover:bg-orange-600"
        }`}
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col" style={{ height: "500px" }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {viewMode !== "home" && (
                  <button onClick={goHome} className="p-1 hover:bg-white/20 rounded">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="font-medium">
                  {viewMode === "home" && "Помощь"}
                  {viewMode === "chat" && "AI Ассистент"}
                  {viewMode === "support" && "Поддержка"}
                </span>
              </div>
              {viewMode === "support" && supportStatus === "active" && (
                <span className="text-xs bg-green-500 px-2 py-0.5 rounded-full">онлайн</span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Guest Warning Banner */}
            {!user && guestId && (
              <div className="px-4 py-2 bg-orange-50 border-b border-orange-100 flex items-center justify-between">
                <span className="text-xs text-orange-600">Режим гостя • История не сохраняется</span>
                <a href="/auth" className="text-xs text-orange-500 hover:underline font-medium">Войти</a>
              </div>
            )}

            {/* Home View */}
            {viewMode === "home" && (
              <div className="p-4">
                {!settings.chat_enabled && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-yellow-800">AI-чат поддержки временно недоступен</p>
                    </div>
                  </div>
                )}
                {/* New Chat Button */}
                <button
                  onClick={startNewChat}
                  disabled={!settings.chat_enabled}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-4 transition-colors ${
                    settings.chat_enabled
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-medium">Новый чат</span>
                </button>

                {/* Chat History */}
                {chatSessions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">История чатов</h3>
                    <div className="space-y-2">
                      {chatSessions.map((session) => (
                        <button
                          key={session.id}
                          onClick={() => openSession(session)}
                          className="w-full flex items-start gap-3 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors"
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            session.is_support ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"
                          }`}>
                            {session.is_support ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {session.title}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatDate(session.created_at)}
                              </span>
                            </div>
                            {session.last_message && (
                              <p className="text-xs text-gray-500 truncate mt-0.5">
                                {session.last_message}
                              </p>
                            )}
                            {session.is_support && session.status === "closed" && (
                              <span className="text-xs text-gray-400">Завершён</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {chatSessions.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-4">
                    Начните новый чат с AI-ассистентом
                  </p>
                )}
              </div>
            )}

            {/* Chat / Support View */}
            {(viewMode === "chat" || viewMode === "support") && (
              <div className="p-4 space-y-3">
                {!settings.chat_enabled && viewMode === "chat" && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                    <svg className="w-8 h-8 text-yellow-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-yellow-800">AI-чат поддержки временно недоступен</p>
                    <button
                      onClick={goHome}
                      className="text-xs text-yellow-600 hover:text-yellow-800 font-medium mt-2"
                    >
                      ← Вернуться
                    </button>
                  </div>
                )}
                {messages.length === 0 && viewMode === "chat" && settings.chat_enabled && (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 text-sm">Привет! Чем могу помочь?</p>
                    <p className="text-gray-400 text-xs mt-1">Задайте вопрос или выберите тему ниже</p>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-2 rounded-2xl ${
                        msg.role === "user"
                          ? "bg-orange-500 text-white rounded-br-md text-sm"
                          : msg.role === "admin"
                          ? "bg-blue-500 text-white rounded-bl-md text-sm"
                          : msg.role === "system"
                          ? "bg-gray-200 text-gray-600 rounded-bl-md italic text-sm"
                          : "bg-gray-100 text-gray-700 rounded-bl-md"
                      }`}
                    >
                      {msg.role === "admin" && (
                        <div className="text-xs text-blue-200 mb-1">Администратор</div>
                      )}
                      {msg.role === "assistant" ? (
                        <div className="markdown-content">{renderMarkdown(msg.content)}</div>
                      ) : (
                        <span className="text-sm">{msg.content}</span>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-md">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Rating for closed support */}
                {showRating && (
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-gray-600 mb-2">Оцените качество поддержки</p>
                    <div className="flex justify-center gap-2 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => submitRating(star)}
                          className="text-2xl transition-transform hover:scale-110 hover:text-yellow-500"
                        >
                          ☆
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={skipRating}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Пропустить
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          {(viewMode === "chat" || (viewMode === "support" && supportStatus === "active")) && user && (
            <div className="border-t border-gray-100 p-3 flex-shrink-0">
              {/* Quick Suggestions */}
              {viewMode === "chat" && messages.length === 0 && quickQuestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {quickQuestions.slice(0, 3).map((q) => (
                    <button
                      key={q.id}
                      onClick={() => handleQuickQuestion(q)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-700 transition-colors"
                    >
                      <span className="text-orange-500">{getIcon(q.icon)}</span>
                      {q.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Connect to Human Button */}
              {viewMode === "chat" && !isSupport && (
                <button
                  onClick={connectToAdmin}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 mb-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-full text-xs text-blue-600 transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Связаться с человеком
                </button>
              )}

              {/* Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={isSupport ? "Напишите администратору..." : "Задайте вопрос..."}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  className="p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 disabled:bg-gray-300 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Closed support - continue with AI */}
          {viewMode === "support" && supportStatus === "closed" && !showRating && (
            <div className="border-t border-gray-100 p-3 text-center">
              <p className="text-sm text-gray-500 mb-2">Чат с администратором завершён</p>
              <button
                onClick={switchToAIMode}
                className="text-sm text-orange-500 hover:text-orange-600 font-medium"
              >
                Продолжить с AI-ассистентом →
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
