/**
 * Conversations API - чаты между работодателями и соискателями
 */

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at?: string;
}

export interface Conversation {
  id: string;
  vacancy_id: string;
  applicant_id: string;
  employer_id: string;
  status: string;
  last_message_at?: string;
  applicant_unread_count: number;
  employer_unread_count: number;
  created_at?: string;
  vacancy_title?: string;
  vacancy_company?: string;
  applicant_name?: string;
  applicant_email?: string;
}

export interface ConversationList {
  conversations: Conversation[];
  total: number;
}

export interface MessageList {
  messages: ConversationMessage[];
  total: number;
}

/**
 * Создать или получить чат для вакансии
 */
export async function createConversation(
  vacancyId: string,
  token: string
): Promise<Conversation> {
  const response = await fetch(`/api/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ vacancy_id: vacancyId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to create conversation");
  }

  return response.json();
}

/**
 * Получить свои чаты
 */
export async function getConversations(
  token: string,
  page = 1
): Promise<ConversationList> {
  const params = new URLSearchParams({ page: page.toString() });

  const response = await fetch(`/api/conversations?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch conversations");
  }

  return response.json();
}

/**
 * Получить количество непрочитанных сообщений
 */
export async function getUnreadCount(token: string): Promise<number> {
  const response = await fetch(`/api/conversations/unread`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return 0;
  }

  const data = await response.json();
  return data.count;
}

/**
 * Получить сообщения из чата
 */
export async function getMessages(
  conversationId: string,
  token: string,
  page = 1
): Promise<MessageList> {
  const params = new URLSearchParams({ page: page.toString() });

  const response = await fetch(
    `/api/conversations/${conversationId}/messages?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch messages");
  }

  return response.json();
}

/**
 * Отправить сообщение
 */
export async function sendConversationMessage(
  conversationId: string,
  content: string,
  token: string
): Promise<ConversationMessage> {
  const response = await fetch(
    `/api/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to send message");
  }

  return response.json();
}

/**
 * Отметить сообщения как прочитанные
 */
export async function markAsRead(
  conversationId: string,
  token: string
): Promise<void> {
  await fetch(`/api/conversations/${conversationId}/read`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
