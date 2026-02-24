"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Resume, createEmptyResume, SectionType } from "@/types/resume";
import {
  getOrCreateGuestId,
  getGuestResume,
  saveGuestResume,
  debouncedSaveResume,
  clearGuestResume,
} from "@/lib/resume-storage";
import { useSubscription } from "@/lib/useSubscription";
import { FileText, User as UserIcon, Briefcase, GraduationCap, Award, Languages, Sparkles, Menu, Eye, X, Wand2 } from "lucide-react";
import MainSection from "./sections/MainSection";
import PersonalInfoSection from "./sections/PersonalInfoSection";
import ContactsSection from "./sections/ContactsSection";
import ExperienceSection from "./sections/ExperienceSection";
import EducationSection from "./sections/EducationSection";
import SkillsSection from "./sections/SkillsSection";
import LanguagesSection from "./sections/LanguagesSection";
import AboutSection from "./sections/AboutSection";
import DesiredPositionSection from "./sections/DesiredPositionSection";
import TemplatesSection from "./sections/TemplatesSection";
import ResumePreview from "./ResumePreview";
import MobileBottomNav from "./MobileBottomNav";
import MobilePreviewModal from "./MobilePreviewModal";
import { exportResumeToPDF, generateResumeFileName } from "@/lib/resume-pdf";
import { useBreakpoint } from "@/hooks/useBreakpoint";

// Типы секций для навигации
type TabType = SectionType | "templates";
type ResumeBuilderUser = { id: string; email?: string };

interface ResumeBuilderProps {
  user: ResumeBuilderUser | null;
}

export default function ResumeBuilder({ user }: ResumeBuilderProps) {
  const router = useRouter();
  const { subscription } = useSubscription();
  const [guestId, setGuestId] = useState<string | null>(null);
  const [resume, setResume] = useState<Resume>(createEmptyResume());
  const [activeTab, setActiveTab] = useState<TabType>("main");
  const [loading, setLoading] = useState(true);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isManualSaving, setIsManualSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showGuestBanner, setShowGuestBanner] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const breakpoint = useBreakpoint();

  // Ключи для localStorage
  const ACTIVE_TAB_STORAGE_KEY = "resume_active_tab";
  const ACTIVE_TAB_TIMESTAMP_KEY = "resume_active_tab_timestamp";
  const TAB_STORAGE_TTL = 10 * 60 * 1000; // 10 минут в миллисекундах

  // Восстановление активного раздела из localStorage (если прошло менее 10 минут)
  useEffect(() => {
    const savedTab = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
    const savedTimestamp = localStorage.getItem(ACTIVE_TAB_TIMESTAMP_KEY);

    if (savedTab && savedTimestamp) {
      const timestamp = parseInt(savedTimestamp, 10);
      const now = Date.now();
      const elapsed = now - timestamp;

      if (elapsed < TAB_STORAGE_TTL) {
        setActiveTab(savedTab as TabType);
      } else {
        // Прошло более 10 минут - очищаем
        localStorage.removeItem(ACTIVE_TAB_STORAGE_KEY);
        localStorage.removeItem(ACTIVE_TAB_TIMESTAMP_KEY);
      }
    }
  }, [ACTIVE_TAB_STORAGE_KEY, ACTIVE_TAB_TIMESTAMP_KEY, TAB_STORAGE_TTL]);

  // Сохранение активного раздела в localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab);
      localStorage.setItem(ACTIVE_TAB_TIMESTAMP_KEY, Date.now().toString());
    }
  }, [activeTab, loading]);

  // Инициализация guest_id
  useEffect(() => {
    if (!user) {
      const id = getOrCreateGuestId();
      setGuestId(id);
      loadGuestResume(id);
    } else {
      // Если пользователь авторизован, загрузить из Supabase
      loadUserResume();
    }
  }, [user]);

  // Загрузка резюме для гостя
  const loadGuestResume = (id: string) => {
    const saved = getGuestResume(id);
    if (saved) {
      setResume(saved);
      setShowGuestBanner(true);
    } else {
      setResume(createEmptyResume(id));
    }
    setLoading(false);
  };

  // Загрузка резюме авторизованного пользователя
  const loadUserResume = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        if (error.code !== "PGRST116") {
          // PGRST116 = no rows, that's ok
        }
      }

      if (data) {
        // Получаем пустое резюме для значений по умолчанию
        const emptyResume = createEmptyResume();

        // Преобразуем данные из БД в формат Resume, мержа с дефолтными значениями
        setResume({
          id: data.id,
          user_id: data.user_id,
          personal_info: {
            first_name: data.personal_info?.first_name || "",
            last_name: data.personal_info?.last_name || "",
            middle_name: data.personal_info?.middle_name || "",
            birth_date: data.personal_info?.birth_date || "",
            photo_url: data.personal_info?.photo_url || "",
            gender: data.personal_info?.gender || null,
          },
          contacts: {
            email: data.contacts?.email || "",
            phone: data.contacts?.phone || "",
            city: data.contacts?.city || "",
            telegram: data.contacts?.telegram || "",
            linkedin: data.contacts?.linkedin || "",
            github: data.contacts?.github || "",
            portfolio: data.contacts?.portfolio || "",
            ready_to_relocate: data.contacts?.ready_to_relocate ?? false,
            employment_type: data.contacts?.employment_type || [],
          },
          desired_position: data.desired_position || "",
          desired_salary: data.desired_salary || "",
          experience: data.work_experience || [],
          education: data.education || [],
          skills: data.skills || "",
          languages: data.languages || [],
          achievements: data.achievements || [],
          about: data.about || "",
          template_id: data.template_id || "modern",
          ats_score: data.ats_score,
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
        setLastSaved(new Date(data.updated_at));
      } else {
        // Резюме не существует - создаем новое с данными из профиля
        const newResume = createEmptyResume();

        // Загружаем данные из профиля пользователя
        try {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("first_name, last_name, patronymic, phone, city, birth_date")
            .eq("user_id", user.id)
            .maybeSingle();

          if (profileData) {
            // Заполняем резюме данными из профиля
            newResume.personal_info = {
              first_name: profileData.first_name || "",
              last_name: profileData.last_name || "",
              middle_name: profileData.patronymic || "",
              birth_date: profileData.birth_date || "",
            };
            newResume.contacts = {
              email: "",
              phone: profileData.phone || "",
              city: profileData.city || "",
              ready_to_relocate: false,
              employment_type: [],
            };
          }
        } catch (profileError) {
          // Продолжаем с пустым резюме
        }

        setResume(newResume);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  // Сохранение резюме (без визуального индикатора)
  const saveResume = useCallback(async () => {
    const now = new Date().toISOString();
    const resumeToSave = {
      ...resume,
      updated_at: now,
    };

    try {
      if (user?.id) {
        // Сохраняем в Supabase
        const upsertData: any = {
          user_id: user.id,
          personal_info: resume.personal_info,
          contacts: resume.contacts,
          desired_position: resume.desired_position,
          desired_salary: resume.desired_salary,
          work_experience: resume.experience,
          education: resume.education,
          skills: resume.skills,
          languages: resume.languages,
          achievements: resume.achievements,
          about: resume.about,
          template_id: resume.template_id,
          updated_at: now,
        };

        // Только для существующих резюме добавляем id
        if (resume.id) {
          upsertData.id = resume.id;
        }

        const { data, error } = await supabase
          .from("resumes")
          .upsert(upsertData)
          .select()
          .single();

        if (error) {
          throw error;
        }

        // Обновляем id если это было новое резюме
        if (data?.id && !resume.id) {
          setResume((prev) => ({ ...prev, id: data.id }));
        }

        // Синхронизируем личные данные с таблицей profiles
        try {
          const profileData: any = {
            user_id: user.id,
            updated_at: now,
          };

          // Извлекаем данные из резюме для синхронизации с профилем
          if (resume.personal_info) {
            if (resume.personal_info.first_name) profileData.first_name = resume.personal_info.first_name;
            if (resume.personal_info.last_name) profileData.last_name = resume.personal_info.last_name;
            if (resume.personal_info.middle_name) profileData.patronymic = resume.personal_info.middle_name;
            if (resume.personal_info.birth_date) profileData.birth_date = resume.personal_info.birth_date;
          }

          if (resume.contacts) {
            if (resume.contacts.phone) profileData.phone = resume.contacts.phone;
            if (resume.contacts.city) profileData.city = resume.contacts.city;
          }

          // Upsert в таблицу profiles
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert(profileData, { onConflict: "user_id" });

          if (profileError) {
            // Не прерываем операцию
          }
        } catch (syncError) {
          // Не прерываем операцию
        }
      } else {
        // Сохраняем в localStorage
        saveGuestResume(resumeToSave);
      }

      setLastSaved(new Date());
      setResume(resumeToSave);
    } catch (err) {
    }
  }, [resume, user]);

  // Ручное сохранение (с индикатором на кнопке)
  const handleManualSave = useCallback(async () => {
    setIsManualSaving(true);
    await saveResume();
    setIsManualSaving(false);
  }, [saveResume]);

  // Debounced autosave
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!loading) {
        setIsAutoSaving(true);
        await saveResume();
        setIsAutoSaving(false);
      }
    }, 2000); // Автосохранение через 2 секунды после изменений

    return () => clearTimeout(timeout);
  }, [resume, loading, saveResume]);

  // Обновление поля резюме
  const updateResume = <K extends keyof Resume>(field: K, value: Resume[K]) => {
    setResume((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Обновление вложенного поля (например, personal_info.first_name)
  const updateNestedField = <T extends keyof Resume>(
    section: T,
    field: string,
    value: string | boolean | string[] | null | undefined
  ) => {
    setResume((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as object),
        [field]: value,
      },
    }));
  };

  // Экспорт в PDF
  const handleExportPDF = useCallback(async () => {
    const previewElement =
      document.getElementById("resume-preview") ||
      document.getElementById("resume-preview-mobile");
    if (!previewElement) {
      alert("Не удалось найти элемент для экспорта. Попробуйте перезагрузить страницу.");
      return;
    }

    setExportingPDF(true);

    try {
      const fileName = generateResumeFileName(
        resume.personal_info.first_name,
        resume.personal_info.last_name,
        resume.desired_position
      );

      await exportResumeToPDF(previewElement as HTMLElement, fileName);
    } catch (error) {
      alert("Не удалось экспортировать PDF. Пожалуйста, попробуйте еще раз.");
    } finally {
      setExportingPDF(false);
    }
  }, [resume]);

  // Навигация по секциям
  const tabs = [
    { id: "main" as const, label: "Главная", icon: Wand2 },
    { id: "personal_info" as const, label: "Личные данные", icon: UserIcon },
    { id: "contacts" as const, label: "Контакты", icon: FileText },
    { id: "desired_position" as const, label: "Желаемая позиция", icon: Briefcase },
    { id: "experience" as const, label: "Опыт работы", icon: Briefcase },
    { id: "education" as const, label: "Образование", icon: GraduationCap },
    { id: "skills" as const, label: "Навыки", icon: Sparkles },
    { id: "languages" as const, label: "Языки", icon: Languages },
    { id: "achievements" as const, label: "Достижения", icon: Award },
    { id: "about" as const, label: "О себе", icon: FileText },
    { id: "templates" as const, label: "Шаблоны", icon: FileText },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#ff6b00] border-t-transparent shadow-[0_0_15px_rgba(255,107,0,0.5)]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-[var(--header-height)])] bg-transparent">
      {/* Header */}
      <header className="bg-[#1f2833]/50 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shrink-0">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Hamburger menu for tablet only (not mobile) */}
          {breakpoint.isTablet && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-300 hover:text-white"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
            <h1 className="text-lg sm:text-xl font-bold text-white">Конструктор резюме</h1>
            <div className="flex items-center gap-2">
              {lastSaved && (
                <span className="text-xs sm:text-sm text-gray-400">
                  {breakpoint.isMobile ? "Сохранено " : "Сохранено в "}{lastSaved.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
              {isAutoSaving && (
                <span className="text-xs sm:text-sm text-[#ff6b00] drop-shadow-[0_0_5px_rgba(255,107,0,0.5)]">Сохранение...</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
          {/* Preview toggle button for tablet */}
          {breakpoint.isTablet && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`p-2 rounded-lg transition-colors ${showPreview
                  ? "bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30"
                  : "hover:bg-white/5 text-gray-400 hover:text-white"
                }`}
              aria-label="Toggle preview"
            >
              <Eye className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => router.back()}
            className="px-3 sm:px-4 py-2 text-gray-300 hover:text-white font-medium text-sm transition-colors"
          >
            {breakpoint.isMobile ? "Назад" : "Назад"}
          </button>
          <button
            onClick={handleManualSave}
            disabled={isManualSaving}
            className="px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] text-white rounded-xl shadow-[0_0_15px_rgba(255,107,0,0.4)] hover:shadow-[0_0_25px_rgba(255,107,0,0.6)] disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm transition-all"
          >
            {isManualSaving ? "..." : "Сохранить"}
          </button>
        </div>
      </header>

      {/* Guest Banner */}
      {showGuestBanner && !user && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-sm text-blue-800">
              Вы создаете резюме без авторизации.{" "}
              <button
                onClick={() => router.push("/auth")}
                className="font-medium underline hover:text-blue-900"
              >
                Войдите или зарегистрируйтесь
              </button>
              , чтобы сохранить резюме в аккаунте.
            </p>
          </div>
        </div>
      )}

      {/* Main Content - Responsive Grid Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile/Tablet Sidebar Overlay */}
        {(breakpoint.isMobile || breakpoint.isTablet) && sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="fixed left-0 top-0 bottom-0 w-72 bg-[#1f2833]/95 backdrop-blur-xl border-r border-white/10 overflow-y-auto z-30 transform transition-transform duration-300 ease-in-out">
              <nav className="p-4 space-y-1 pt-16">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                          ? "bg-white/10 text-[#00f0ff] shadow-[inset_2px_0_0_0_#00f0ff]"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                        }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]" : ""}`} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </aside>
          </>
        )}

        {/* Desktop Sidebar - Always Visible */}
        {breakpoint.isDesktop && (
          <aside className="w-64 bg-[#1f2833]/40 backdrop-blur-md border-r border-white/10 overflow-y-auto custom-scrollbar hidden lg:block">
            <nav className="p-4 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                        ? "bg-white/10 text-[#00f0ff] shadow-[inset_2px_0_0_0_#00f0ff]"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]" : ""}`} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </aside>
        )}

        {/* Middle Panel - Editor */}
        <main className={`flex-1 overflow-y-auto custom-scrollbar ${breakpoint.isMobile ? "pb-20" : "p-4 sm:p-6"}`}>
          <div className={`${breakpoint.isMobile ? "px-3 py-4" : "max-w-2xl mx-auto"} min-h-full`}>
            <div className={`bg-[#1f2833]/50 backdrop-blur-xl rounded-xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] ${breakpoint.isMobile ? "p-4" : "p-6 sm:p-8"}`}>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 tracking-wide drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] border-b border-white/10 pb-4">
                {tabs.find((t) => t.id === activeTab)?.label}
              </h2>

              {/* Рендер соответствующей секции */}
              {activeTab === "main" && (
                <MainSection
                  userId={user?.id}
                  onResumeGenerated={(data) => {
                    if (data.personal_info) updateResume("personal_info", data.personal_info);
                    if (data.contacts) updateResume("contacts", data.contacts);
                    if (data.desired_position) updateResume("desired_position", data.desired_position);
                    if (data.desired_salary) updateResume("desired_salary", data.desired_salary);
                    if (data.experience) updateResume("experience", data.experience);
                    if (data.education) updateResume("education", data.education);
                    if (data.skills) updateResume("skills", data.skills);
                    if (data.languages) updateResume("languages", data.languages);
                    if (data.achievements) updateResume("achievements", data.achievements);
                    if (data.about) updateResume("about", data.about);
                    if (data.template_id) updateResume("template_id", data.template_id);
                  }}
                  currentResume={resume}
                />
              )}

              {activeTab === "personal_info" && (
                <PersonalInfoSection
                  data={resume.personal_info}
                  userId={user?.id}
                  onChange={(field, value) =>
                    updateNestedField("personal_info", field, value)
                  }
                />
              )}

              {activeTab === "contacts" && (
                <ContactsSection
                  data={resume.contacts}
                  onChange={(field, value) =>
                    updateNestedField("contacts", field, value)
                  }
                />
              )}

              {activeTab === "desired_position" && (
                <DesiredPositionSection
                  position={resume.desired_position}
                  salary={resume.desired_salary || ""}
                  onPositionChange={(value) => updateResume("desired_position", value)}
                  onSalaryChange={(value) => updateResume("desired_salary", value)}
                />
              )}

              {activeTab === "experience" && (
                <ExperienceSection
                  data={resume.experience}
                  onChange={(value) => updateResume("experience", value)}
                  userId={user?.id}
                  isPro={subscription?.is_pro}
                  isProTrial={subscription?.is_pro_trial}
                />
              )}

              {activeTab === "education" && (
                <EducationSection
                  data={resume.education}
                  onChange={(value) => updateResume("education", value)}
                />
              )}

              {activeTab === "skills" && (
                <SkillsSection
                  data={resume.skills}
                  onChange={(value) => updateResume("skills", value)}
                />
              )}

              {activeTab === "languages" && (
                <LanguagesSection
                  data={resume.languages}
                  onChange={(value) => updateResume("languages", value)}
                />
              )}

              {activeTab === "achievements" && (
                <div className="text-gray-500">
                  Секция достижений в разработке
                </div>
              )}

              {activeTab === "about" && (
                <AboutSection
                  data={resume.about}
                  onChange={(value) => updateResume("about", value)}
                  userId={user?.id}
                  isPro={subscription?.is_pro}
                  isProTrial={subscription?.is_pro_trial}
                />
              )}

              {activeTab === "templates" && (
                <TemplatesSection
                  selectedTemplate={resume.template_id}
                  onTemplateChange={(templateId) => updateResume("template_id", templateId)}
                />
              )}
            </div>
          </div>
        </main>

        {/* Right Panel - Preview - Desktop Only */}
        {breakpoint.isDesktop && (
          <aside className="w-[400px] xl:w-[500px] border-l border-white/10 bg-[#0b0c10]/40 backdrop-blur-md h-full hidden lg:block custom-scrollbar">
            <ResumePreview
              resume={resume}
              currentTemplate={resume.template_id}
              onExportPDF={handleExportPDF}
              exportingPDF={exportingPDF}
              showTemplateSelector={false}
            />
          </aside>
        )}

        {/* Tablet Preview - Slide-up Panel */}
        {breakpoint.isTablet && showPreview && (
          <>
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20"
              onClick={() => setShowPreview(false)}
            />
            <aside className="fixed right-0 top-0 bottom-0 w-full sm:w-[500px] bg-[#0b0c10]/95 backdrop-blur-xl border-l border-white/10 z-30 overflow-hidden">
              <ResumePreview
                resume={resume}
                currentTemplate={resume.template_id}
                onExportPDF={handleExportPDF}
                exportingPDF={exportingPDF}
                showTemplateSelector={false}
              />
            </aside>
          </>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      {breakpoint.isMobile && (
        <MobileBottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}

      {/* Mobile Preview Modal */}
      {breakpoint.isMobile && showPreview && (
        <MobilePreviewModal
          resume={resume}
          currentTemplate={resume.template_id}
          onExportPDF={handleExportPDF}
          exportingPDF={exportingPDF}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Mobile Floating Action Button for Preview */}
      {breakpoint.isMobile && !showPreview && (
        <button
          onClick={() => setShowPreview(true)}
          className="fixed bottom-20 right-4 z-30 w-14 h-14 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] text-white rounded-full shadow-[0_0_15px_rgba(255,107,0,0.5)] hover:shadow-[0_0_25px_rgba(255,107,0,0.7)] transition-all flex items-center justify-center"
          aria-label="Preview resume"
        >
          <Eye className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}

// Добавляем тип SectionType
declare module "@/types/resume" {
  export type SectionType =
    | "main"
    | "personal_info"
    | "contacts"
    | "desired_position"
    | "experience"
    | "education"
    | "skills"
    | "languages"
    | "achievements"
    | "about";
}
