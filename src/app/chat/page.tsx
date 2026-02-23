"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ChatInput, { SearchMode, LifestylePreferences } from "@/components/chat/ChatInput";
import ChatMessages, { Message, SearchPhase } from "@/components/chat/ChatMessages";
import { Chat } from "@/components/chat/ChatListModal";
import { sendMessageStream, Vacancy } from "@/lib/api";
import ConfirmModal from "@/components/ui/ConfirmModal";
import VacancyFeedDrawer from "@/components/chat/VacancyFeedDrawer";
import { useSubscriptionContext } from "@/components/subscription";
import { useSiteSettings } from "@/lib/useSiteSettings";
import AppHeader from "@/components/app/Header";

const DEFAULT_LIFESTYLE_PREFERENCES: LifestylePreferences = {
  full_remote_only: false,
  no_mandatory_calls: false,
  async_first: false,
  flexible_hours: false,
  strict_mode: false,
};

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
  const [lastLifestylePreferences, setLastLifestylePreferences] = useState<LifestylePreferences>(
    DEFAULT_LIFESTYLE_PREFERENCES
  );

  // Search phase state for new UX flow
  const [searchPhase, setSearchPhase] = useState<SearchPhase>('idle');
  const [showStartingText, setShowStartingText] = useState(false);
  const [hasReceivedFirstVacancy, setHasReceivedFirstVacancy] = useState(false);

  // AbortController для остановки запроса
  const abortControllerRef = useRef<AbortController | null>(null);
  // Ref to track phase transition timeout
  const phaseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Vacancy feed drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Сгруппировать вакансии по запросам пользователя
  const vacancyGroups = useMemo(() => {
    const groups: { query: string; vacancies: Vacancy[] }[] = [];

    messages.forEach((msg, index) => {
      // Ищем пары: user -> assistant с вакансиями
      if (msg.role === "user" && index + 1 < messages.length) {
        const nextMsg = messages[index + 1];
        if (nextMsg?.role === "assistant" && nextMsg.vacancies && nextMsg.vacancies.length > 0) {
          groups.push({
            query: msg.content,
            vacancies: nextMsg.vacancies,
          });
        }
      }
    });

    // Добавляем текущие streaming вакансии
    if (streamingVacancies.length > 0 && messages.length > 0) {
      const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
      if (lastUserMsg) {
        groups.push({
          query: lastUserMsg.content,
          vacancies: streamingVacancies,
        });
      }
    }

    return groups;
  }, [messages, streamingVacancies]);

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
    } catch {
    } finally {
      setLoadingChats(false);
    }
  }, [user?.id]);

  // Load messages for a chat
  const loadMessages = useCallback(async (chatId: string) => {
    try {
      type StoredMessageRow = {
        id: string;
        role: "user" | "assistant";
        content: string;
        vacancies?: Vacancy[] | null;
        rejected_vacancies?: Vacancy[] | null;
      };

      const mapMessages = (rows: StoredMessageRow[]) => (
        (rows || []).map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          vacancies: m.vacancies || undefined,
          rejectedVacancies: m.rejected_vacancies || undefined,
        }))
      );

      // New schema path (with rejected_vacancies)
      let { data, error } = await supabase
        .from("messages")
        .select("id, role, content, vacancies, rejected_vacancies, created_at")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      // Fallback for instances where migration is not yet applied
      if (error) {
        const fallback = await supabase
          .from("messages")
          .select("id, role, content, vacancies, created_at")
          .eq("chat_id", chatId)
          .order("created_at", { ascending: true });
        data = fallback.data as unknown as typeof data;
        error = fallback.error;
      }

      if (error) throw error;
      setMessages(mapMessages((data || []) as unknown as StoredMessageRow[]));
    } catch {
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
    } catch {
      return null;
    }
  };

  // Save message to database
  const saveMessage = async (
    chatId: string,
    role: "user" | "assistant",
    content: string,
    vacancies?: Vacancy[],
    rejectedVacancies?: Vacancy[]
  ) => {
    try {
      const payload = {
        chat_id: chatId,
        role,
        content,
        vacancies: vacancies && vacancies.length > 0 ? vacancies : null,
        rejected_vacancies: rejectedVacancies && rejectedVacancies.length > 0 ? rejectedVacancies : null,
      };

      let { error } = await supabase.from("messages").insert(payload as Record<string, unknown>);
      if (error) {
        // Fallback for instances where rejected_vacancies column is not deployed yet
        ({ error } = await supabase.from("messages").insert({
          chat_id: chatId,
          role,
          content,
          vacancies: vacancies && vacancies.length > 0 ? vacancies : null,
        }));
      }
      if (error) throw error;
    } catch {
    }
  };

  const handleStop = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;

      // Clear phase timeout if active
      if (phaseTimeoutRef.current) {
        clearTimeout(phaseTimeoutRef.current);
        phaseTimeoutRef.current = null;
      }

      // Handle phase-specific behavior
      if (searchPhase === 'starting' || searchPhase === 'searching') {
        setSearchPhase('completed');
      }

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
          await saveMessage(currentChatId, "assistant", finalText, finalVacancies, finalRejectedVacancies);
        }
      }

      setIsTyping(false);
      setStreamingText("");
      setStreamingVacancies([]);
      setStreamingRejectedVacancies([]);
      setSearchPhase('idle'); // Reset phase
    }
  };

  const handleLoadMore = async (messageId: string) => {
    if (!user?.id || !currentChatId) return;

    // Проверяем, включён ли AI-поиск
    if (!settings.chat_enabled && !isAdmin) {
      const errorMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "AI временно не доступен, мы уже работаем над проблемой.",
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

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
    setHasReceivedFirstVacancy(false);

    // UX Phase transitions for "Load More" - same as handleSend
    setSearchPhase('starting');
    setShowStartingText(true);

    // Clear any existing phase transition timeout
    if (phaseTimeoutRef.current) {
      clearTimeout(phaseTimeoutRef.current);
      phaseTimeoutRef.current = null;
    }

    setTimeout(() => {
      setShowStartingText(false);
      phaseTimeoutRef.current = null;
    }, 500);

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
          // Track first vacancy arrival for UX phase transition
          if (!hasReceivedFirstVacancy && newVacancies.length > 0) {
            // Clear the phase transition timeout since we got vacancies
            if (phaseTimeoutRef.current) {
              clearTimeout(phaseTimeoutRef.current);
              phaseTimeoutRef.current = null;
            }
            setHasReceivedFirstVacancy(true);
            setSearchPhase('firstVacancyFound');
          }

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
          // Clear phase timeout if still active
          if (phaseTimeoutRef.current) {
            clearTimeout(phaseTimeoutRef.current);
            phaseTimeoutRef.current = null;
          }
          setSearchPhase('completed');

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
          setSearchPhase('idle'); // Reset phase

          // Save assistant message with vacancies
          await saveMessage(currentChatId!, "assistant", fullText, vacancies, rejectedVacancies);

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
        abortController.signal,
        // lifestylePreferences
        lastLifestylePreferences,
        // onProgress
        (progressMessage) => {
          if (!progressMessage) return;
          if (progressMessage.includes("Ищу вакансии")) {
            if (phaseTimeoutRef.current) {
              clearTimeout(phaseTimeoutRef.current);
              phaseTimeoutRef.current = null;
            }
            setShowStartingText(false);
            setSearchPhase('searching');
          }
        }
      );
    } catch (error) {
      // Clear phase timeout on error
      if (phaseTimeoutRef.current) {
        clearTimeout(phaseTimeoutRef.current);
        phaseTimeoutRef.current = null;
      }
      // Игнорируем ошибку если запрос был отменен
      if (error instanceof Error && error.name === 'AbortError') {

        return;
      }

      const errorMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "AI временно не доступен, мы уже работаем над проблемой.",
      };

      setMessages((prev) => [...prev, errorMessage]);
      setIsTyping(false);
      setStreamingText("");
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleSend = async (
    content: string,
    searchMode: SearchMode,
    lifestylePreferences: LifestylePreferences
  ) => {
    if (!user?.id) return;

    // Проверяем, включён ли AI-поиск
    if (!settings.chat_enabled && !isAdmin) {
      const errorMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "AI временно не доступен, мы уже работаем над проблемой.",
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

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
    setLastLifestylePreferences(lifestylePreferences);

    // Initialize search phase state
    setSearchPhase('starting');
    setShowStartingText(true);
    setHasReceivedFirstVacancy(false);
    setStreamingText("");
    setStreamingVacancies([]);
    setStreamingRejectedVacancies([]);

    // Clear any existing phase transition timeout
    if (phaseTimeoutRef.current) {
      clearTimeout(phaseTimeoutRef.current);
      phaseTimeoutRef.current = null;
    }

    // Transition to 'searching' phase after delay
    phaseTimeoutRef.current = setTimeout(() => {
      setShowStartingText(false);
      phaseTimeoutRef.current = null;
    }, 500);

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
          // Track first vacancy arrival for UX phase transition
          if (!hasReceivedFirstVacancy && newVacancies.length > 0) {
            // Clear the phase transition timeout since we got vacancies
            if (phaseTimeoutRef.current) {
              clearTimeout(phaseTimeoutRef.current);
              phaseTimeoutRef.current = null;
            }
            setHasReceivedFirstVacancy(true);
            setSearchPhase('firstVacancyFound');
          }

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
          // Clear phase timeout if still active
          if (phaseTimeoutRef.current) {
            clearTimeout(phaseTimeoutRef.current);
            phaseTimeoutRef.current = null;
          }
          setSearchPhase('completed');

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
          setSearchPhase('idle'); // Reset phase

          // Save assistant message with vacancies
          await saveMessage(chatId!, "assistant", fullText, vacancies, rejectedVacancies);

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
        abortController.signal,
        // lifestylePreferences
        lifestylePreferences,
        // onProgress
        (progressMessage) => {
          if (!progressMessage) return;
          if (progressMessage.includes("Ищу вакансии")) {
            if (phaseTimeoutRef.current) {
              clearTimeout(phaseTimeoutRef.current);
              phaseTimeoutRef.current = null;
            }
            setShowStartingText(false);
            setSearchPhase('searching');
          }
        }
      );
    } catch (error) {
      // Clear phase timeout on error
      if (phaseTimeoutRef.current) {
        clearTimeout(phaseTimeoutRef.current);
        phaseTimeoutRef.current = null;
      }
      // Игнорируем ошибку если запрос был отменен
      if (error instanceof Error && error.name === 'AbortError') {

        return;
      }

      const errorMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "AI временно не доступен, мы уже работаем над проблемой.",
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
    } catch {
    } finally {
      setDeleteModalOpen(false);
      setChatToDelete(null);
    }
  };

  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0c10]">
        <div className="animate-spin w-8 h-8 border-4 border-[#ff6b00] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!settings.chat_enabled && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#0b0c10]">
        <header className="bg-[#1f2833]/80 backdrop-blur-md border-b border-[#c5c6c7]/10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            <Link href="/" className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Job Search
            </Link>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20">
          <div className="bg-[#1f2833]/40 backdrop-blur-sm rounded-xl border border-[#c5c6c7]/10 p-8 text-center shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <div className="w-16 h-16 bg-[#ff6b00]/10 border border-[#ff6b00]/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg className="w-8 h-8 text-[#ff6b00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">
              AI-поиск временно недоступен
            </h1>
            <p className="text-[#c5c6c7]/80">
              Функция отключена администратором. Пожалуйста, попробуйте позже.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-[#0b0c10] relative">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />
      {/* Universal Header */}
      <AppHeader showRequestCounter={true} hideOnMobile={isDrawerOpen} />

      {/* Chat area */}
      <main className="flex-1 flex flex-col relative overflow-hidden pt-16 sm:pt-20 min-h-0 z-10">
        {/* Messages area - always present but hidden when empty */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden pb-40 sm:pb-10 transition-opacity duration-500 ${hasStarted && showMessages ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <ChatMessages
            messages={messages}
            isTyping={isTyping}
            streamingText={streamingText}
            streamingVacancies={streamingVacancies}
            streamingRejectedVacancies={streamingRejectedVacancies}
            onLoadMore={handleLoadMore}
            searchPhase={searchPhase}
            showStartingText={showStartingText}
            isDrawerOpen={isDrawerOpen}
            onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
          />
        </div>

        {/* Loading indicator when fetching chat history */}
        {isLoadingChat && !showMessages && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="animate-spin w-8 h-8 border-4 border-[#ff6b00] border-t-transparent rounded-full shadow-[0_0_15px_rgba(255,107,0,0.5)]" />
          </div>
        )}

        {/* Input area - animated from center to bottom using transform */}
        <div
          className={`absolute left-0 right-0 transition-all duration-700 ease-out ${hasStarted
              ? 'bottom-0 translate-y-0 bg-gradient-to-t from-[#0b0c10] via-[#0b0c10] to-transparent pt-8 pb-4'
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

      {/* Vacancy feed drawer */}
      <VacancyFeedDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        groups={vacancyGroups}
        isLoading={isTyping}
      />

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
