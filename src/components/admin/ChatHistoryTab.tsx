"use client";

import { useState, useEffect } from "react";
import { getAdminChats, getAdminChatMessages, AdminChat, AdminChatMessage } from "@/lib/api";

interface Props {
  token: string;
}

export default function ChatHistoryTab({ token }: Props) {
  const [chats, setChats] = useState<AdminChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<AdminChat | null>(null);
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [expandedVacancies, setExpandedVacancies] = useState<Set<string>>(new Set());

  // Загрузка чатов
  useEffect(() => {
    fetchChats();
  }, [page, searchQuery]);

  const fetchChats = async () => {
    setLoading(true);
    try {
      const result = await getAdminChats(token, page, 50, searchQuery || undefined);
      setChats(result.chats);
      setTotal(result.total);
      setPages(result.pages);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const selectChat = async (chat: AdminChat) => {
    setSelectedChat(chat);
    setMessagesLoading(true);
    setExpandedVacancies(new Set());
    try {
      const result = await getAdminChatMessages(token, chat.id);
      setMessages(result.messages);
    } catch (e) {
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const toggleVacancies = (messageId: string) => {
    setExpandedVacancies((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-200px)]">
      {/* Список чатов */}
      <div className="w-1/3 bg-[#1f2833]/50 backdrop-blur-xl rounded-xl border border-white/10 flex flex-col shadow-xl">
        {/* Заголовок и поиск */}
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white mb-3">Чаты пользователей</h2>
          <input
            type="text"
            placeholder="Поиск по email или названию..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-black/20 text-white placeholder-gray-500 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00f0ff] focus:border-[#00f0ff] text-sm transition-colors"
          />
        </div>

        {/* Список */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#00f0ff]" />
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Чаты не найдены
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => selectChat(chat)}
                  className={`p-4 cursor-pointer hover:bg-white/5 transition-colors ${selectedChat?.id === chat.id ? "bg-white/10 border-l-4 border-[#00f0ff]" : ""
                    }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="font-medium text-white text-sm truncate flex-1">
                      {chat.email}
                    </div>
                    <div className="text-xs text-gray-400 ml-2">
                      {chat.message_count} {chat.message_count === 1 ? "сообщение" : "сообщений"}
                    </div>
                  </div>
                  <div className="text-sm text-gray-400 truncate mb-1">
                    {chat.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(chat.updated_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Пагинация */}
        {pages > 1 && (
          <div className="p-3 border-t border-white/10 flex items-center justify-between bg-black/10">
            <div className="text-sm text-gray-400">
              {total} чат{total !== 1 ? "ов" : ""}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 rounded disabled:opacity-50 transition-colors"
              >
                Назад
              </button>
              <span className="px-3 py-1 text-sm text-gray-400">
                {page} / {pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="px-3 py-1 text-sm border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 rounded disabled:opacity-50 transition-colors"
              >
                Вперёд
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Сообщения чата */}
      <div className="w-2/3 bg-[#1f2833]/50 backdrop-blur-xl rounded-xl border border-white/10 flex flex-col shadow-xl">
        {selectedChat ? (
          <>
            {/* Заголовок чата */}
            <div className="p-4 border-b border-white/10 bg-black/20 rounded-t-xl">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-white">{selectedChat.title}</h3>
                <div className="text-sm text-gray-400">{selectedChat.email}</div>
              </div>
              <div className="text-xs text-gray-500">
                Создан: {formatDate(selectedChat.created_at)} •
                Обновлён: {formatDate(selectedChat.updated_at)}
              </div>
            </div>

            {/* Сообщения */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#00f0ff]" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  В этом чате нет сообщений
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === "user"
                            ? "bg-gradient-to-br from-[#00f0ff] to-[#00b8ff] text-black shadow-[0_4px_15px_rgba(0,240,255,0.2)]"
                            : "bg-[#0b0c10] text-gray-200 border border-white/10"
                          }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium opacity-70">
                            {message.role === "user" ? "Пользователь" : "AI Ассистент"}
                          </span>
                          <span className="text-xs opacity-50">
                            {formatDate(message.created_at)}
                          </span>
                        </div>
                        <div className="whitespace-pre-wrap break-words text-sm">
                          {message.content}
                        </div>

                        {/* Вакансии в ответе AI */}
                        {message.role === "assistant" && message.vacancies && message.vacancies.length > 0 && (
                          <div className="mt-3 border-t border-white/10 pt-3">
                            <button
                              onClick={() => toggleVacancies(message.id)}
                              className="text-xs font-medium text-[#00f0ff] hover:text-[#00b8ff] flex items-center gap-1 transition-colors"
                            >
                              <svg
                                className={`w-4 h-4 transition-transform ${expandedVacancies.has(message.id) ? "rotate-90" : ""
                                  }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                              {message.vacancies.length} ваканси{message.vacancies.length > 1 ? "й" : ""}
                            </button>
                            {expandedVacancies.has(message.id) && (
                              <div className="mt-2 space-y-2">
                                {message.vacancies.map((vacancy: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="bg-black/40 border border-white/5 rounded-lg p-3 text-xs"
                                  >
                                    <div className="font-medium text-white mb-1">{vacancy.title}</div>
                                    <div className="text-gray-400 mb-1">
                                      {vacancy.company} • {vacancy.city}
                                    </div>
                                    <div className="text-[#00ff88]">
                                      {vacancy.salary_from || vacancy.salary_to
                                        ? `${vacancy.salary_from || ""}${vacancy.salary_from && vacancy.salary_to ? " - " : ""
                                        }${vacancy.salary_to || ""} ₽`
                                        : "Зарплата не указана"}
                                    </div>
                                    {vacancy.url && (
                                      <a
                                        href={vacancy.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#00f0ff] hover:text-[#00b8ff] hover:underline mt-2 inline-block transition-colors"
                                      >
                                        Открыть →
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Выберите чат для просмотра сообщений
          </div>
        )}
      </div>
    </div>
  );
}
