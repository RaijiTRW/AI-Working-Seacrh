"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ChatInput from "@/components/chat/ChatInput";
import ChatMessages, { Message } from "@/components/chat/ChatMessages";
import { Chat } from "@/components/chat/ChatListModal";
import { sendMessageStream, Vacancy } from "@/lib/api";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [streamingVacancies, setStreamingVacancies] = useState<Vacancy[]>([]);
  const [streamingRejectedVacancies, setStreamingRejectedVacancies] = useState<Vacancy[]>([]);

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

  const handleSend = async (content: string) => {
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

    try {
      let fullText = "";
      let vacancies: Vacancy[] = [];
      let rejectedVacancies: Vacancy[] = [];

      await sendMessageStream(
        content,
        user.id,
        chatId,
        // onText
        (text) => {
          fullText += text;
          setStreamingText(fullText);
        },
        // onVacancies
        (newVacancies) => {
          vacancies = newVacancies;
          setStreamingVacancies(newVacancies);
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
        },
        // onRejectedVacancies
        (newRejectedVacancies) => {
          rejectedVacancies = newRejectedVacancies;
          setStreamingRejectedVacancies(newRejectedVacancies);
        }
      );
    } catch (error) {
      console.error("Error sending message:", error);

      const errorMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "Не удалось связаться с сервером. Проверь подключение и попробуй снова.",
      };

      setMessages((prev) => [...prev, errorMessage]);
      setIsTyping(false);
      setStreamingText("");
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="shrink-0 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Job AI Search
          </Link>
          <nav className="hidden sm:flex items-center gap-6">
            <Link
              href="/vacancies"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Вакансии
            </Link>
            <span className="text-sm font-medium text-orange-600">AI-поиск</span>
          </nav>
          <Link
            href="/profile"
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Профиль
          </Link>
        </div>
      </header>

      {/* Chat area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Messages area - always present but hidden when empty */}
        <div className={`flex-1 overflow-y-auto transition-opacity duration-500 ${hasStarted && showMessages ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <ChatMessages
            messages={messages}
            isTyping={isTyping}
            streamingText={streamingText}
            streamingVacancies={streamingVacancies}
            streamingRejectedVacancies={streamingRejectedVacancies}
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
            disabled={isTyping}
            centered={!hasStarted}
            chats={chats}
            currentChatId={currentChatId}
            onSelectChat={handleSelectChat}
            onNewChat={handleNewChat}
            onDeleteChat={handleDeleteChat}
            loadingChats={loadingChats}
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
