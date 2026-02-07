"use client";

import { AgentInfo } from "@/lib/api";

interface AgentCardProps {
  agent: AgentInfo;
  onToggle: (enabled: boolean) => void;
  isLoading?: boolean;
}

export default function AgentCard({ agent, onToggle, isLoading }: AgentCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{agent.name}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{agent.description}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <div className={`w-2 h-2 rounded-full ${agent.enabled ? "bg-green-500" : "bg-gray-400"}`} />
            <span className={`text-xs ${agent.enabled ? "text-green-700" : "text-gray-500"}`}>
              {agent.enabled ? "Включён" : "Выключен"}
            </span>
          </div>
        </div>
        <button
          onClick={() => onToggle(!agent.enabled)}
          disabled={isLoading}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            agent.enabled ? "bg-green-500" : "bg-gray-200"
          } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              agent.enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
