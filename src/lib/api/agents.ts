/**
 * AI Agents API - управление AI агентами
 */

const NEXT_API = "";

export interface AgentInfo {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  model_type: "main" | "fast";
}

export interface AgentsStatus {
  [agentId: string]: AgentInfo;
}

export async function getAgentsStatus(token: string): Promise<AgentsStatus> {
  // Add cache-busting parameter
  const cacheBuster = Date.now();
  const response = await fetch(`${NEXT_API}/api/admin/agents/status?_=${cacheBuster}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Cache-Control': 'no-cache',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[getAgentsStatus] Error:", response.status, errorText);
    throw new Error("Failed to fetch agents status");
  }

  return response.json();
}

export async function toggleAgent(
  token: string,
  agentId: string,
  enabled: boolean
): Promise<void> {
  const response = await fetch(`${NEXT_API}/api/admin/agents/toggle`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ agent_id: agentId, enabled }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[toggleAgent] Error:", response.status, errorText);
    throw new Error("Failed to toggle agent");
  }
}

// === Support Chat API ===

export interface SupportChatStatus {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export async function getSupportChatStatus(token: string): Promise<SupportChatStatus> {
  const response = await fetch(`${NEXT_API}/api/admin/support-chat/status`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    // Если ошибка, возвращаем дефолтное значение
    return { id: "support_chat", name: "AI-чат поддержки", description: "Чат поддержки в углу экрана", enabled: true };
  }

  return response.json();
}

export async function toggleSupportChat(token: string, enabled: boolean): Promise<void> {
  const response = await fetch(`${NEXT_API}/api/admin/support-chat/toggle`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ enabled }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[toggleSupportChat] Error:", response.status, errorText);
    throw new Error("Failed to toggle support chat");
  }
}
