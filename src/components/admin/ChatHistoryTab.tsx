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
      <div className="w-1/3 bg-white rounded-xl border border-gray-200 flex flex-col">
        {/* Заголовок и поиск */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Чаты пользователей</h2>
          <input
            type="text"
            placeholder="Поиск по email или названию..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
          />
        </div>

        {/* Список */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" />
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Чаты не найдены
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => selectChat(chat)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedChat?.id === chat.id ? "bg-orange-50 border-l-4 border-orange-500" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="font-medium text-gray-900 text-sm truncate flex-1">
                      {chat.email}
                    </div>
                    <div className="text-xs text-gray-500 ml-2">
                      {chat.message_count} {chat.message_count === 1 ? "сообщение" : "сообщений"}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 truncate mb-1">
                    {chat.title}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatDate(chat.updated_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Пагинация */}
        {pages > 1 && (
          <div className="p-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {total} чат{total !== 1 ? "ов" : ""}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-gray-200 rounded disabled:opacity-50 hover:bg-gray-50"
              >
                Назад
              </button>
              <span className="px-3 py-1 text-sm text-gray-600">
                {page} / {pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="px-3 py-1 text-sm border border-gray-200 rounded disabled:opacity-50 hover:bg-gray-50"
              >
                Вперёд
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Сообщения чата */}
      <div className="w-2/3 bg-white rounded-xl border border-gray-200 flex flex-col">
        {selectedChat ? (
          <>
            {/* Заголовок чата */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{selectedChat.title}</h3>
                <div className="text-sm text-gray-500">{selectedChat.email}</div>
              </div>
              <div className="text-xs text-gray-400">
                Создан: {formatDate(selectedChat.created_at)} •
                Обновлён: {formatDate(selectedChat.updated_at)}
              </div>
            </div>

            {/* Сообщения */}
            <div className="flex-1 overflow-y-auto p-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" />
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
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === "user"
                            ? "bg-orange-500 text-white"
                            : "bg-gray-100 text-gray-900"
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
                          <div className="mt-3 border-t border-black/10 pt-3">
                            <button
                              onClick={() => toggleVacancies(message.id)}
                              className="text-xs font-medium opacity-70 hover:opacity-100 flex items-center gap-1"
                            >
                              <svg
                                className={`w-4 h-4 transition-transform ${
                                  expandedVacancies.has(message.id) ? "rotate-90" : ""
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
                                    className="bg-white/20 rounded-lg p-3 text-xs"
                                  >
                                    <div className="font-medium mb-1">{vacancy.title}</div>
                                    <div className="opacity-80 mb-1">
                                      {vacancy.company} • {vacancy.city}
                                    </div>
                                    <div className="opacity-80">
                                      {vacancy.salary_from || vacancy.salary_to
                                        ? `${vacancy.salary_from || ""}${
                                            vacancy.salary_from && vacancy.salary_to ? " - " : ""
                                          }${vacancy.salary_to || ""} ₽`
                                        : "Зарплата не указана"}
                                    </div>
                                    {vacancy.url && (
                                      <a
                                        href={vacancy.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-orange-200 hover:text-orange-100 underline mt-1 inline-block"
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
