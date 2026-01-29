"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ChatInput, { SearchMode } from "@/components/chat/ChatInput";
import ChatMessages, { Message } from "@/components/chat/ChatMessages";
import { Chat } from "@/components/chat/ChatListModal";
import { sendMessageStream, Vacancy } from "@/lib/api";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useSubscriptionContext } from "@/components/subscription";
import { useSiteSettings } from "@/lib/useSiteSettings";

export default function ChatPage() {
  const router = useRouter();
  const { subscription, refresh: refreshSubscription } = useSubscriptionContext();
  const { settings, loading: settingsLoading } = useSiteSettings();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [streamingVacancies, setStreamingVacancies] = useState<Vacancy[]>([]);
  const [streamingRejectedVacancies, setStreamingRejectedVacancies] = useState<Vacancy[]>([]);

  // AbortController для остановки запроса
  const abortControllerRef = useRef<AbortController | null>(null);

  // Chats
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [loadingChats, setLoadingChats] = useState(false);

  // Animation state for loading existing chat
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [showMessages, setShowMessages] = useState(true);

  // Delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const hasStarted = messages.length > 0 || isLoadingChat;

  // Load chats
  const loadChats = useCallback(async () => {
    if (!user?.id) return;

    setLoadingChats(true);
    try {
      const { data, error } = await supabase
        .from("chats")
        .select("id, title, updated_at")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setChats(data || []);
    } catch (err) {
      console.error("Error loading chats:", err);
    } finally {
      setLoadingChats(false);
    }
  }, [user?.id]);

  // Load messages for a chat
  const loadMessages = useCallback(async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("id, role, content, vacancies, created_at")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setMessages(
        (data || []).map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          vacancies: m.vacancies as Vacancy[] | undefined,
        }))
      );
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  }, []);

  // Check user and load chats
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
      } else {
        setUser({ id: user.id, email: user.email });

        // Check if user is admin
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        setIsAdmin(profile?.role === "admin");
      }
      setLoading(false);
    };
    checkUser();
  }, [router]);

  useEffect(() => {
    if (user?.id) {
      loadChats();
    }
  }, [user?.id, loadChats]);

  const handleLogout = async () => {
    // Не удаляем связанные аккаунты при выходе - они должны сохраняться
    await supabase.auth.signOut();
    router.push("/");
  };

  // Create new chat
  const createChat = async (firstMessage: string): Promise<string | null> => {
    if (!user?.id) return null;

    try {
      const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "");

      const { data, error } = await supabase
        .from("chats")
        .insert({ user_id: user.id, title })
        .select("id")
        .single();

      if (error) throw error;
      return data.id;
    } catch (err) {
      console.error("Error creating chat:", err);
      return null;
    }
  };

  // Save message to database
  const saveMessage = async (
    chatId: string,
    role: "user" | "assistant",
    content: string,
    vacancies?: Vacancy[]
  ) => {
    try {
      await supabase.from("messages").insert({
        chat_id: chatId,
        role,
        content,
        vacancies: vacancies && vacancies.length > 0 ? vacancies : null,
      });
    } catch (err) {
      console.error("Error saving message:", err);
    }
  };

  const handleStop = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;

      // Сохраняем то, что уже было найдено
      const finalText = streamingText || "Поиск остановлен.";
      const finalVacancies = streamingVacancies;
      const finalRejectedVacancies = streamingRejectedVacancies;

      // Создаем сообщение с тем, что успели найти
      if (finalVacancies.length > 0 || finalText) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: finalText,
          vacancies: finalVacancies.length > 0 ? finalVacancies : undefined,
          rejectedVacancies: finalRejectedVacancies.length > 0 ? finalRejectedVacancies : undefined,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Сохраняем в БД если есть chatId
        if (currentChatId) {
          await saveMessage(currentChatId, "assistant", finalText, finalVacancies);
        }
      }

      setIsTyping(false);
      setStreamingText("");
      setStreamingVacancies([]);
      setStreamingRejectedVacancies([]);
    }
  };

  const handleLoadMore = async (messageId: string) => {
    if (!user?.id || !currentChatId) return;

    // Найти сообщение с этим ID
    const message = messages.find((m) => m.id === messageId);
    if (!message || message.role !== "assistant" || !message.vacancies) return;

    // Собрать все ID вакансий (approved + rejected)
    const excludeIds: string[] = [];
    if (message.vacancies) {
      excludeIds.push(...message.vacancies.map((v) => v.id));
    }
    if (message.rejectedVacancies) {
      excludeIds.push(...message.rejectedVacancies.map((v) => v.id));
    }

    // Отправить запрос "найди еще" с exclude_vacancy_ids
    const loadMoreMessage = "найди еще";

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: loadMoreMessage,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    setStreamingText("");
    setStreamingVacancies([]);
    setStreamingRejectedVacancies([]);

    // Save user message
    await saveMessage(currentChatId, "user", loadMoreMessage);

    // Создаем AbortController для возможности остановки
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      let fullText = "";
      let vacancies: Vacancy[] = [];
      let rejectedVacancies: Vacancy[] = [];

      await sendMessageStream(
        loadMoreMessage,
        user.id,
        currentChatId,
        { searchInFeed: true, searchOnline: true }, // Ищем везде
        // onText
        (text) => {
          fullText += text;
          setStreamingText(fullText);
        },
        // onVacancies
        (newVacancies) => {
          // Дедупликация внутри chunk
          const seenInChunk = new Set<string>();
          const deduplicatedChunk = newVacancies.filter(v => {
            if (seenInChunk.has(v.id)) return false;
            seenInChunk.add(v.id);
            return true;
          });

          // Дедупликация относительно существующих вакансий
          const existingIds = new Set(vacancies.map(v => v.id));
          const uniqueNew = deduplicatedChunk.filter(v => !existingIds.has(v.id));
          vacancies = [...vacancies, ...uniqueNew];
          setStreamingVacancies(vacancies);
        },
        // onDone
        async () => {
          const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: fullText || "Произошла ошибка, попробуй ещё раз.",
            vacancies: vacancies.length > 0 ? vacancies : undefined,
            rejectedVacancies: rejectedVacancies.length > 0 ? rejectedVacancies : undefined,
          };

          setMessages((prev) => [...prev, assistantMessage]);
          setIsTyping(false);
          setStreamingText("");
          setStreamingVacancies([]);
          setStreamingRejectedVacancies([]);

          // Save assistant message with vacancies
          await saveMessage(currentChatId!, "assistant", fullText, vacancies);

          // Reload chats to update the list
          loadChats();

          // Update subscription limits
          refreshSubscription();
        },
        // onRejectedVacancies
        (newRejectedVacancies) => {
          // Дедупликация внутри chunk
          const seenInChunk = new Set<string>();
          const deduplicatedChunk = newRejectedVacancies.filter(v => {
            if (seenInChunk.has(v.id)) return false;
            seenInChunk.add(v.id);
            return true;
          });

          // Дедупликация относительно существующих вакансий
          const existingIds = new Set(rejectedVacancies.map(v => v.id));
          const uniqueNew = deduplicatedChunk.filter(v => !existingIds.has(v.id));
          rejectedVacancies = [...rejectedVacancies, ...uniqueNew];
          setStreamingRejectedVacancies(rejectedVacancies);
        },
        // excludeVacancyIds
        excludeIds,
        // signal
        abortController.signal
      );
    } catch (error) {
      // Игнорируем ошибку если запрос был отменен
      if (error instanceof Error && error.name === 'AbortError') {
        console.log("Request was aborted");
        return;
      }
      console.error("Error sending message:", error);

      const errorMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "Не удалось связаться с сервером. Проверь подключение и попробуй снова.",
      };

      setMessages((prev) => [...prev, errorMessage]);
      setIsTyping(false);
      setStreamingText("");
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleSend = async (content: string, searchMode: SearchMode) => {
    if (!user?.id) return;

    let chatId = currentChatId;

    // Create new chat if needed
    if (!chatId) {
      chatId = await createChat(content);
      if (!chatId) return;
      setCurrentChatId(chatId);
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    setStreamingText("");
    setStreamingVacancies([]);
    setStreamingRejectedVacancies([]);

    // Save user message
    await saveMessage(chatId, "user", content);

    // Создаем AbortController для возможности остановки
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      let fullText = "";
      let vacancies: Vacancy[] = [];
      let rejectedVacancies: Vacancy[] = [];

      await sendMessageStream(
        content,
        user.id,
        chatId,
        searchMode,
        // onText
        (text) => {
          fullText += text;
          setStreamingText(fullText);
        },
        // onVacancies
        (newVacancies) => {
          // Дедупликация внутри chunk
          const seenInChunk = new Set<string>();
          const deduplicatedChunk = newVacancies.filter(v => {
            if (seenInChunk.has(v.id)) return false;
            seenInChunk.add(v.id);
            return true;
          });

          // Дедупликация относительно существующих вакансий
          const existingIds = new Set(vacancies.map(v => v.id));
          const uniqueNew = deduplicatedChunk.filter(v => !existingIds.has(v.id));
          vacancies = [...vacancies, ...uniqueNew];
          setStreamingVacancies(vacancies);
        },
        // onDone
        async () => {
          const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: fullText || "Произошла ошибка, попробуй ещё раз.",
            vacancies: vacancies.length > 0 ? vacancies : undefined,
            rejectedVacancies: rejectedVacancies.length > 0 ? rejectedVacancies : undefined,
          };

          setMessages((prev) => [...prev, assistantMessage]);
          setIsTyping(false);
          setStreamingText("");
          setStreamingVacancies([]);
          setStreamingRejectedVacancies([]);

          // Save assistant message with vacancies
          await saveMessage(chatId!, "assistant", fullText, vacancies);

          // Reload chats to update the list
          loadChats();

          // Update subscription limits
          refreshSubscription();
        },
        // onRejectedVacancies
        (newRejectedVacancies) => {
          // Дедупликация внутри chunk
          const seenInChunk = new Set<string>();
          const deduplicatedChunk = newRejectedVacancies.filter(v => {
            if (seenInChunk.has(v.id)) return false;
            seenInChunk.add(v.id);
            return true;
          });

          // Дедупликация относительно существующих вакансий
          const existingIds = new Set(rejectedVacancies.map(v => v.id));
          const uniqueNew = deduplicatedChunk.filter(v => !existingIds.has(v.id));
          rejectedVacancies = [...rejectedVacancies, ...uniqueNew];
          setStreamingRejectedVacancies(rejectedVacancies);
        },
        // excludeVacancyIds
        undefined,
        // signal
        abortController.signal
      );
    } catch (error) {
      // Игнорируем ошибку если запрос был отменен
      if (error instanceof Error && error.name === 'AbortError') {
        console.log("Request was aborted");
        return;
      }
      console.error("Error sending message:", error);

      const errorMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "Не удалось связаться с сервером. Проверь подключение и попробуй снова.",
      };

      setMessages((prev) => [...prev, errorMessage]);
      setIsTyping(false);
      setStreamingText("");
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleSelectChat = async (chatId: string) => {
    // Start transition - input moves down first
    setIsLoadingChat(true);
    setShowMessages(false);
    setCurrentChatId(chatId);

    // Wait for input to animate down
    await new Promise(resolve => setTimeout(resolve, 400));

    // Load messages
    await loadMessages(chatId);

    // Show messages with fade-in
    setShowMessages(true);
    setIsLoadingChat(false);
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setStreamingText("");
    setStreamingVacancies([]);
    setStreamingRejectedVacancies([]);
  };

  const handleDeleteChat = (chatId: string) => {
    setChatToDelete(chatId);
    setDeleteModalOpen(true);
  };

  const confirmDeleteChat = async () => {
    if (!chatToDelete) return;

    try {
      // Удаляем сообщения чата
      await supabase.from("messages").delete().eq("chat_id", chatToDelete);
      // Удаляем сам чат
      await supabase.from("chats").delete().eq("id", chatToDelete);

      // Если удаляем текущий чат — сбрасываем
      if (currentChatId === chatToDelete) {
        handleNewChat();
      }

      // Обновляем список чатов
      loadChats();
    } catch (err) {
      console.error("Error deleting chat:", err);
    } finally {
      setDeleteModalOpen(false);
      setChatToDelete(null);
    }
  };

  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!settings.chat_enabled && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header
          className="border-b"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderColor: "rgba(200,200,200,0.3)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)"
          }}
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            <Link href="/" className="text-lg sm:text-xl font-bold text-gray-900">
              Job Search
            </Link>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              AI-поиск временно недоступен
            </h1>
            <p className="text-gray-600">
              Функция отключена администратором. Пожалуйста, попробуйте позже.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header with Soft UI */}
      <header
        className="shrink-0 border-b"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderColor: "rgba(200,200,200,0.3)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)"
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="text-lg sm:text-xl font-bold text-gray-900">
            Job Search
          </Link>
          <nav className="hidden md:flex items-center gap-3">
            <Link
              href="/vacancies"
              className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 relative overflow-hidden transition-all hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(145deg, #fafafa, #e5e5e5)",
                boxShadow: "4px 4px 10px rgba(150,150,150,0.12), -4px -4px 10px rgba(255,255,255,0.8), inset 0 1px 2px rgba(255,255,255,0.6)"
              }}
            >
              <span className="relative z-10">Вакансии</span>
            </Link>
            <span
              className="px-4 py-2 rounded-full text-sm font-medium text-orange-600 relative overflow-hidden"
              style={{
                background: "linear-gradient(145deg, #fff7ed, #ffedd5)",
                boxShadow: "4px 4px 10px rgba(200,100,0,0.12), -4px -4px 10px rgba(255,220,180,0.5), inset 0 1px 2px rgba(255,255,255,0.6)"
              }}
            >
              <div className="absolute top-0 left-2 right-2 h-2 rounded-b-full blur-sm pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.6), transparent)" }} />
              <span className="relative z-10">AI-поиск</span>
            </span>
            {/* Request counter */}
            {subscription && (
              <Link
                href="/subscription"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium relative overflow-hidden transition-all hover:-translate-y-0.5"
                style={
                  subscription.limits.remaining > 0
                    ? {
                        background: "linear-gradient(145deg, #eff6ff, #dbeafe)",
                        color: "#1d4ed8",
                        boxShadow: "4px 4px 10px rgba(30,80,200,0.12), -4px -4px 10px rgba(100,180,255,0.5), inset 0 1px 2px rgba(255,255,255,0.6)"
                      }
                    : {
                        background: "linear-gradient(145deg, #fef2f2, #fee2e2)",
                        color: "#dc2626",
                        boxShadow: "4px 4px 10px rgba(200,30,30,0.12), -4px -4px 10px rgba(255,100,100,0.5), inset 0 1px 2px rgba(255,255,255,0.6)"
                      }
                }
              >
                <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="relative z-10">{subscription.limits.remaining} запрос{subscription.limits.remaining === 1 ? "" : subscription.limits.remaining >= 2 && subscription.limits.remaining <= 4 ? "а" : "ов"}</span>
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile request counter */}
            {subscription && (
              <Link
                href="/subscription"
                className="md:hidden flex items-center gap-1 px-2.5 py-2 rounded-full text-sm font-medium relative overflow-hidden transition-all hover:-translate-y-0.5"
                style={
                  subscription.limits.remaining > 0
                    ? {
                        background: "linear-gradient(145deg, #eff6ff, #dbeafe)",
                        color: "#1d4ed8",
                        boxShadow: "4px 4px 10px rgba(30,80,200,0.12), -4px -4px 10px rgba(100,180,255,0.5), inset 0 1px 2px rgba(255,255,255,0.6)"
                      }
                    : {
                        background: "linear-gradient(145deg, #fef2f2, #fee2e2)",
                        color: "#dc2626",
                        boxShadow: "4px 4px 10px rgba(200,30,30,0.12), -4px -4px 10px rgba(255,100,100,0.5), inset 0 1px 2px rgba(255,255,255,0.6)"
                      }
                }
              >
                <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="relative z-10">{subscription.limits.remaining}</span>
              </Link>
            )}
            <Link
              href="/messages"
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-gray-700 rounded-full text-sm font-medium relative overflow-hidden transition-all hover:-translate-y-0.5 active:scale-95"
              style={{
                background: "linear-gradient(145deg, #fafafa, #e5e5e5)",
                boxShadow: "4px 4px 10px rgba(150,150,150,0.12), -4px -4px 10px rgba(255,255,255,0.8), inset 0 1px 2px rgba(255,255,255,0.6)"
              }}
            >
              <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="hidden sm:inline relative z-10">Сообщения</span>
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-gray-700 rounded-full text-sm font-medium relative overflow-hidden transition-all hover:-translate-y-0.5 active:scale-95"
              style={{
                background: "linear-gradient(145deg, #fafafa, #e5e5e5)",
                boxShadow: "4px 4px 10px rgba(150,150,150,0.12), -4px -4px 10px rgba(255,255,255,0.8), inset 0 1px 2px rgba(255,255,255,0.6)"
              }}
            >
              <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="hidden sm:inline relative z-10">Профиль</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Chat area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Messages area - always present but hidden when empty */}
        <div className={`flex-1 overflow-y-auto pb-10 transition-opacity duration-500 ${hasStarted && showMessages ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <ChatMessages
            messages={messages}
            isTyping={isTyping}
            streamingText={streamingText}
            streamingVacancies={streamingVacancies}
            streamingRejectedVacancies={streamingRejectedVacancies}
            onLoadMore={handleLoadMore}
          />
        </div>

        {/* Loading indicator when fetching chat history */}
        {isLoadingChat && !showMessages && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
          </div>
        )}

        {/* Input area - animated from center to bottom using transform */}
        <div
          className={`absolute left-0 right-0 transition-all duration-700 ease-out ${
            hasStarted
              ? 'bottom-0 translate-y-0 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent pt-4'
              : 'bottom-1/2 translate-y-1/2'
          }`}
        >
          <ChatInput
            onSend={handleSend}
            onStop={handleStop}
            disabled={isTyping}
            isTyping={isTyping}
            centered={!hasStarted}
            chats={chats}
            currentChatId={currentChatId}
            onSelectChat={handleSelectChat}
            onNewChat={handleNewChat}
            onDeleteChat={handleDeleteChat}
            loadingChats={loadingChats}
            canSearchOnline={subscription?.subscription?.can_search_online ?? true}
          />
        </div>
      </main>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Удалить чат?"
        message="Это действие нельзя отменить. Все сообщения будут удалены."
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={confirmDeleteChat}
        onCancel={() => {
          setDeleteModalOpen(false);
          setChatToDelete(null);
        }}
        danger
      />
    </div>
  );
}
