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
import { FileText, User as UserIcon, Briefcase, GraduationCap, Award, Languages, Sparkles, Menu, Eye, X } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<TabType>("personal_info");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showGuestBanner, setShowGuestBanner] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const breakpoint = useBreakpoint();

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
        console.error("Resume load error:", error);
        if (error.code !== "PGRST116") {
          // PGRST116 = no rows, that's ok
          console.error("Error loading resume:", error.message);
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
        setResume(createEmptyResume());
      }
    } catch (err) {
      console.error("Resume load exception:", err);
    } finally {
      setLoading(false);
    }
  };

  // Сохранение резюме
  const saveResume = useCallback(async () => {
    setSaving(true);

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
          console.error("Supabase upsert error:", error);
          throw error;
        }

        // Обновляем id если это было новое резюме
        if (data?.id && !resume.id) {
          setResume((prev) => ({ ...prev, id: data.id }));
        }
      } else {
        // Сохраняем в localStorage
        saveGuestResume(resumeToSave);
      }

      setLastSaved(new Date());
      setResume(resumeToSave);
    } catch (err) {
      console.error("Resume save error:", err);
    } finally {
      setSaving(false);
    }
  }, [resume, user]);

  // Debounced autosave
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!loading) {
        saveResume();
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
      console.error("Preview element not found");
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
      console.error("PDF export failed:", error);
      alert("Не удалось экспортировать PDF. Пожалуйста, попробуйте еще раз.");
    } finally {
      setExportingPDF(false);
    }
  }, [resume]);

  // Навигация по секциям
  const tabs = [
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shrink-0">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Hamburger menu for tablet only (not mobile) */}
          {breakpoint.isTablet && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-gray-700" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700" />
              )}
            </button>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Конструктор резюме</h1>
            <div className="flex items-center gap-2">
              {lastSaved && (
                <span className="text-xs sm:text-sm text-gray-500">
                  {breakpoint.isMobile ? "Сохранено " : "Сохранено в "}{lastSaved.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
              {saving && (
                <span className="text-xs sm:text-sm text-orange-500">Сохранение...</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
          {/* Preview toggle button for tablet */}
          {breakpoint.isTablet && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`p-2 rounded-lg transition-colors ${
                showPreview
                  ? "bg-orange-100 text-orange-700"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
              aria-label="Toggle preview"
            >
              <Eye className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => router.back()}
            className="px-3 sm:px-4 py-2 text-gray-700 hover:text-gray-900 font-medium text-sm"
          >
            {breakpoint.isMobile ? "Назад" : "Назад"}
          </button>
          <button
            onClick={saveResume}
            disabled={saving}
            className="px-3 sm:px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 font-medium text-sm"
          >
            {saving ? "..." : "Сохранить"}
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
              className="fixed inset-0 bg-black/50 z-20"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-gray-200 overflow-y-auto z-30 transform transition-transform duration-300 ease-in-out">
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
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
              </nav>
            </aside>
          </>
        )}

        {/* Desktop Sidebar - Always Visible */}
        {breakpoint.isDesktop && (
          <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto hidden lg:block">
            <nav className="p-4 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
            </nav>
          </aside>
        )}

        {/* Middle Panel - Editor */}
        <main className={`flex-1 overflow-y-auto ${breakpoint.isMobile ? "pb-20" : "p-4 sm:p-6"}`}>
          <div className={`${breakpoint.isMobile ? "px-3 py-4" : "max-w-2xl mx-auto"} min-h-full`}>
            <div className={`bg-white rounded-xl border border-gray-200 ${breakpoint.isMobile ? "p-4" : "p-6"}`}>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">
                {tabs.find((t) => t.id === activeTab)?.label}
              </h2>

              {/* Рендер соответствующей секции */}
              {activeTab === "personal_info" && (
                <PersonalInfoSection
                  data={resume.personal_info}
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
          <aside className="w-[400px] xl:w-[500px] border-l border-gray-200 h-full hidden lg:block">
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
              className="fixed inset-0 bg-black/50 z-20"
              onClick={() => setShowPreview(false)}
            />
            <aside className="fixed right-0 top-0 bottom-0 w-full sm:w-[500px] bg-white border-l border-gray-200 z-30 overflow-hidden">
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
          className="fixed bottom-20 right-4 z-30 w-14 h-14 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 transition-colors flex items-center justify-center"
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
