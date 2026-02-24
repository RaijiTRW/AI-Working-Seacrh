"use client";

import { AgentInfo } from "@/lib/api";

interface AgentCardProps {
  agent: AgentInfo;
  onToggle: (enabled: boolean) => void;
  isLoading?: boolean;
}

export default function AgentCard({ agent, onToggle, isLoading }: AgentCardProps) {
  return (
    <div className="bg-[#1f2833]/50 backdrop-blur-xl border border-white/10 p-4 shadow-[0_0_15px_rgba(0,0,0,0.5)] rounded-xl">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-white">{agent.name}</h3>
          <p className="text-sm text-gray-400 mt-0.5">{agent.description}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <div className={`w-2 h-2 rounded-full ${agent.enabled ? "bg-[#00ff88] shadow-[0_0_8px_rgba(0,255,136,0.6)]" : "bg-gray-500"}`} />
            <span className={`text-xs ${agent.enabled ? "text-[#00ff88]" : "text-gray-500"}`}>
              {agent.enabled ? "Включён" : "Выключен"}
            </span>
          </div>
        </div>
        <button
          onClick={() => onToggle(!agent.enabled)}
          disabled={isLoading}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${agent.enabled ? "bg-[#00ff88]" : "bg-black/60 border border-white/10"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          style={{
            boxShadow: agent.enabled ? "0 0 10px rgba(0,255,136,0.4)" : "none",
          }}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${agent.enabled ? "translate-x-5" : "translate-x-0"
              }`}
          />
        </button>
      </div>
    </div>
  );
}
