"use client";

import { User as UserIcon, FileText, Briefcase, GraduationCap, Sparkles, MoreVertical, Wand2 } from "lucide-react";
import { useState } from "react";

type TabType = "main" | "personal_info" | "contacts" | "desired_position" | "experience" | "education" | "skills" | "languages" | "achievements" | "about" | "templates";

interface MobileBottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const mainTabs = [
  { id: "main" as const, label: "Главная", icon: Wand2 },
  { id: "personal_info" as const, label: "Личные", icon: UserIcon },
  { id: "contacts" as const, label: "Контакты", icon: FileText },
  { id: "desired_position" as const, label: "Позиция", icon: Briefcase },
  { id: "experience" as const, label: "Опыт", icon: Briefcase },
  { id: "education" as const, label: "Образ.", icon: GraduationCap },
];

const moreTabs = [
  { id: "skills" as const, label: "Навыки", icon: Sparkles },
  { id: "languages" as const, label: "Языки", icon: FileText },
  { id: "achievements" as const, label: "Достиж.", icon: FileText },
  { id: "about" as const, label: "О себе", icon: FileText },
  { id: "templates" as const, label: "Шаблоны", icon: FileText },
];

export default function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const isInMainTabs = mainTabs.some((tab) => tab.id === activeTab);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                  isActive ? "text-orange-600" : "text-gray-600"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "fill-orange-100" : ""}`} />
                <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
              </button>
            );
          })}

          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                !isInMainTabs ? "text-orange-600" : "text-gray-600"
              }`}
            >
              <MoreVertical className={`w-5 h-5 ${!isInMainTabs ? "fill-orange-100" : ""}`} />
              <span className="text-[10px] font-medium">Ещё</span>
            </button>

            {/* More Menu */}
            {showMoreMenu && (
              <>
                <div
                  className="fixed inset-0 bg-black/20 z-10"
                  onClick={() => setShowMoreMenu(false)}
                />
                <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 w-48 z-20">
                  {moreTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          onTabChange(tab.id);
                          setShowMoreMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-orange-50 text-orange-700"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Add padding for safe area on iOS */}
      <style jsx>{`
        .safe-area-inset-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
      `}</style>
    </>
  );
}
