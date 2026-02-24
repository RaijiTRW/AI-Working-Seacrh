"use client";

import { useState, useEffect, useRef } from "react";

interface SupportChat {
  id: string;
  user_id: string;
  status: "active" | "closed";
  admin_id?: string;
  rating?: number;
  created_at: string;
  closed_at?: string;
  user_email?: string;
  last_message?: string;
  unread_count?: number;
  subscription_plan?: "pro_trial" | "base" | "pro";
  is_pro?: boolean;
}

// Приоритет планов для сортировки: Pro > Pro Trial > Base
const PLAN_PRIORITY: Record<string, number> = {
  pro: 1,
  pro_trial: 2,
  base: 3,
};

// Бейджи для планов
const PLAN_BADGES: Record<string, { label: string; className: string }> = {
  pro: {
    label: "PRO",
    className: "bg-gradient-to-r from-[#ff6b00] to-[#ff8c33] text-white shadow-[0_0_10px_rgba(255,107,0,0.5)]",
  },
  pro_trial: {
    label: "TRIAL",
    className: "bg-gradient-to-r from-[#00f0ff] to-[#00b8ff] text-black shadow-[0_0_10px_rgba(0,240,255,0.5)]",
  },
  base: {
    label: "BASE",
    className: "bg-white/10 text-gray-300 border border-white/20",
  },
};

interface Message {
  id: string;
  chat_id: string;
  sender_type: "user" | "admin" | "ai";
  sender_id?: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Props {
  token: string;
}

export default function SupportChatTab({ token }: Props) {
  const [activeChats, setActiveChats] = useState<SupportChat[]>([]);
  const [archivedChats, setArchivedChats] = useState<SupportChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<SupportChat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Загрузка чатов
  useEffect(() => {
    fetchChats();
  }, [showArchive]);

  // Polling для обновления сообщений
  useEffect(() => {
    if (selectedChat && selectedChat.status === "active") {
      pollingRef.current = setInterval(() => fetchChatMessages(selectedChat.id), 3000);
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [selectedChat?.id, selectedChat?.status]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchChats = async () => {
    try {
      if (showArchive) {
        const response = await fetch(`/api/support/admin/archive`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setArchivedChats(data.chats);
        }
      } else {
        const response = await fetch(`/api/support/admin/chats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setActiveChats(data.chats);
        }
      }
    } catch (e) {
    }
  };

  const fetchChatMessages = async (chatId: string) => {
    try {
      const response = await fetch(`/api/support/admin/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        // Обновляем данные чата
        if (data.chat) {
          setSelectedChat(data.chat);
        }
      }
    } catch (e) {
    }
  };

  const selectChat = async (chat: SupportChat) => {
    setSelectedChat(chat);
    await fetchChatMessages(chat.id);
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !selectedChat) return;

    const message = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch(`/api/support/admin/send-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ chat_id: selectedChat.id, message }),
      });

      if (response.ok) {
        await fetchChatMessages(selectedChat.id);
      }
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  };

  const closeChat = async () => {
    if (!selectedChat) return;

    if (!confirm("Вы уверены, что хотите завершить этот чат?")) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/support/admin/close-chat/${selectedChat.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setSelectedChat(null);
        setMessages([]);
        await fetchChats();
      }
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Сортировка чатов по приоритету плана: Pro > Pro Trial > Base
  const sortedActiveChats = [...activeChats].sort((a, b) => {
    const priorityA = PLAN_PRIORITY[a.subscription_plan || "base"] || 99;
    const priorityB = PLAN_PRIORITY[b.subscription_plan || "base"] || 99;
    if (priorityA !== priorityB) return priorityA - priorityB;
    // При одинаковом приоритете — по непрочитанным
    if ((a.unread_count || 0) !== (b.unread_count || 0)) {
      return (b.unread_count || 0) - (a.unread_count || 0);
    }
    // Потом по дате создания (новые выше)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const chats = showArchive ? archivedChats : sortedActiveChats;

  return (
    <div className="bg-[#1f2833]/50 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden shadow-xl">
      {/* Tabs */}
      <div className="flex border-b border-white/10 bg-black/20">
        <button
          onClick={() => {
            setShowArchive(false);
            setSelectedChat(null);
          }}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${!showArchive
              ? "bg-white/10 text-[#00f0ff] border-b-2 border-[#00f0ff]"
              : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
        >
          Активные ({activeChats.length})
        </button>
        <button
          onClick={() => {
            setShowArchive(true);
            setSelectedChat(null);
          }}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${showArchive
              ? "bg-white/10 text-[#00f0ff] border-b-2 border-[#00f0ff]"
              : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
        >
          Архив
        </button>
      </div>

      <div className="flex h-[500px]">
        {/* Chat List */}
        <div className="w-1/3 border-r border-white/10 overflow-y-auto custom-scrollbar bg-black/10">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              {showArchive ? "Архив пуст" : "Нет активных чатов"}
            </div>
          ) : (
            chats.map((chat) => {
              const plan = chat.subscription_plan || "base";
              const badge = PLAN_BADGES[plan] || PLAN_BADGES.base;
              const borderColor = plan === "pro" ? "border-l-[#ff6b00]" : plan === "pro_trial" ? "border-l-[#00f0ff]" : "border-l-gray-600";

              return (
                <button
                  key={chat.id}
                  onClick={() => selectChat(chat)}
                  className={`w-full p-4 text-left border-b border-white/5 hover:bg-white/5 transition-colors ${selectedChat?.id === chat.id ? "bg-white/10" : ""
                    } border-l-4 ${borderColor}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${badge.className}`}>
                        {badge.label}
                      </span>
                      <span className="font-medium text-white text-sm truncate">
                        {chat.user_email || "Пользователь"}
                      </span>
                    </div>
                    {chat.unread_count && chat.unread_count > 0 && (
                      <span className="bg-[#ff6b00] text-white shadow-[0_0_10px_rgba(255,107,0,0.5)] text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                        {chat.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {chat.last_message || "Нет сообщений"}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">
                      {formatDate(chat.created_at)}
                    </span>
                    {chat.rating && (
                      <span className="text-xs">{"⭐".repeat(chat.rating)}</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-black/20">
                <div>
                  <div className="font-medium text-white flex items-center gap-2">
                    {(() => {
                      const plan = selectedChat.subscription_plan || "base";
                      const badge = PLAN_BADGES[plan] || PLAN_BADGES.base;
                      return (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badge.className}`}>
                          {badge.label}
                        </span>
                      );
                    })()}
                    {selectedChat.user_email || "Пользователь"}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {selectedChat.status === "active" ? "Активный чат" : "Завершён"}
                    {selectedChat.subscription_plan === "pro" && <span className="text-[#ff6b00]"> • Приоритетная поддержка</span>}
                    {selectedChat.subscription_plan === "pro_trial" && <span className="text-[#00f0ff]"> • Pro Trial</span>}
                    {selectedChat.rating && <span className="text-[#00ff88]"> • Оценка: {"⭐".repeat(selectedChat.rating)}</span>}
                  </div>
                </div>
                {selectedChat.status === "active" && (
                  <button
                    onClick={closeChat}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-[#ff3333]/10 text-[#ff3333] border border-[#ff3333]/30 text-sm rounded-lg hover:bg-[#ff3333]/20 transition-colors disabled:opacity-50"
                  >
                    Завершить чат
                  </button>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === "admin" ? "justify-end" : "justify-start"
                      }`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm ${msg.sender_type === "admin"
                          ? "bg-gradient-to-br from-[#00f0ff] to-[#00b8ff] text-black shadow-[0_4px_15px_rgba(0,240,255,0.2)] rounded-br-sm"
                          : msg.sender_type === "user"
                            ? "bg-[#0b0c10] border border-white/10 text-gray-200 rounded-bl-sm"
                            : "bg-[#2a1b38] border border-[#ff6b00]/30 text-[#ffb88a] rounded-bl-sm"
                        }`}
                    >
                      {msg.sender_type === "ai" && (
                        <div className="text-xs text-[#ff6b00] mb-1 font-medium">AI</div>
                      )}
                      {msg.sender_type === "user" && (
                        <div className="text-xs text-gray-400 mb-1">Пользователь</div>
                      )}
                      {msg.content}
                      <div
                        className={`text-xs mt-1 ${msg.sender_type === "admin" ? "text-gray-800" : "text-gray-500"
                          }`}
                      >
                        {formatDate(msg.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {selectedChat.status === "active" && (
                <div className="border-t border-white/10 p-3 bg-black/10">
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
                      placeholder="Введите ответ..."
                      disabled={isLoading}
                      className="flex-1 px-4 py-2 bg-black/20 border border-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00f0ff] focus:border-[#00f0ff] placeholder-gray-500 transition-colors"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={isLoading || !inputValue.trim()}
                      className="px-4 py-2 bg-[#00f0ff] text-black rounded-lg hover:bg-[#00b8ff] shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-50 disabled:shadow-none transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>Выберите чат для просмотра</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
