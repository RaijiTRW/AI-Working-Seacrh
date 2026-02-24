"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface ResumeSectionProps {
  userId: string;
}

interface WorkExperience {
  id: string;
  company: string;
  position: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  start_year: string;
  end_year: string;
}

interface Resume {
  desired_position: string;
  desired_salary: string;
  skills: string;
  about: string;
  work_experience: WorkExperience[];
  education: Education[];
}

export default function ResumeSection({ userId }: ResumeSectionProps) {
  const [resume, setResume] = useState<Resume>({
    desired_position: "",
    desired_salary: "",
    skills: "",
    about: "",
    work_experience: [],
    education: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadResume();
  }, [userId]);

  const loadResume = async () => {
    try {
      const { data } = await supabase
        .from("resumes")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (data) {
        setResume({
          desired_position: data.desired_position || "",
          desired_salary: data.desired_salary || "",
          skills: data.skills || "",
          about: data.about || "",
          work_experience: data.work_experience || [],
          education: data.education || [],
        });
      }
    } catch (err) {
      // Resume doesn't exist yet
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from("resumes")
        .upsert(
          {
            user_id: userId,
            ...resume,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (error) throw error;
      setMessage({ type: "success", text: "Резюме сохранено" });
    } catch (err) {
      setMessage({ type: "error", text: "Ошибка сохранения" });
    } finally {
      setSaving(false);
    }
  };

  const addWorkExperience = () => {
    setResume({
      ...resume,
      work_experience: [
        ...resume.work_experience,
        {
          id: Date.now().toString(),
          company: "",
          position: "",
          start_date: "",
          end_date: "",
          is_current: false,
          description: "",
        },
      ],
    });
  };

  const removeWorkExperience = (id: string) => {
    setResume({
      ...resume,
      work_experience: resume.work_experience.filter((w) => w.id !== id),
    });
  };

  const updateWorkExperience = (id: string, field: keyof WorkExperience, value: string | boolean) => {
    setResume({
      ...resume,
      work_experience: resume.work_experience.map((w) =>
        w.id === id ? { ...w, [field]: value } : w
      ),
    });
  };

  const addEducation = () => {
    setResume({
      ...resume,
      education: [
        ...resume.education,
        {
          id: Date.now().toString(),
          institution: "",
          degree: "",
          field: "",
          start_year: "",
          end_year: "",
        },
      ],
    });
  };

  const removeEducation = (id: string) => {
    setResume({
      ...resume,
      education: resume.education.filter((e) => e.id !== id),
    });
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setResume({
      ...resume,
      education: resume.education.map((e) =>
        e.id === id ? { ...e, [field]: value } : e
      ),
    });
  };

  if (loading) {
    return (
      <div className="bg-[#1f2833]/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-1/4" />
          <div className="h-10 bg-white/10 rounded" />
          <div className="h-10 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Basic info */}
      <div className="bg-[#1f2833]/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-white mb-6">Основная информация</h2>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Желаемая должность</label>
            <input
              type="text"
              value={resume.desired_position}
              onChange={(e) => setResume({ ...resume, desired_position: e.target.value })}
              className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#ff6b00] focus:border-[#ff6b00] transition-colors"
              placeholder="Менеджер по продажам"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Желаемая зарплата</label>
            <input
              type="text"
              value={resume.desired_salary}
              onChange={(e) => setResume({ ...resume, desired_salary: e.target.value })}
              className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#ff6b00] focus:border-[#ff6b00] transition-colors"
              placeholder="от 80 000 ₽"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Ключевые навыки</label>
            <input
              type="text"
              value={resume.skills}
              onChange={(e) => setResume({ ...resume, skills: e.target.value })}
              className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#ff6b00] focus:border-[#ff6b00] transition-colors"
              placeholder="Excel, 1C, переговоры, продажи"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">О себе</label>
            <textarea
              value={resume.about}
              onChange={(e) => setResume({ ...resume, about: e.target.value })}
              rows={4}
              className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#ff6b00] focus:border-[#ff6b00] transition-colors resize-none"
              placeholder="Расскажите о себе, своих достижениях и целях..."
            />
          </div>
        </div>
      </div>

      {/* Work experience */}
      <div className="bg-[#1f2833]/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Опыт работы</h2>
          <button
            onClick={addWorkExperience}
            className="text-sm text-[#00f0ff] hover:text-[#00f0ff]/80 font-medium transition-colors"
          >
            + Добавить
          </button>
        </div>

        {resume.work_experience.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">Нет записей об опыте работы</p>
        ) : (
          <div className="space-y-6">
            {resume.work_experience.map((work, index) => (
              <div key={work.id} className="bg-black/20 border border-white/10 rounded-xl p-5">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-medium text-gray-400">Место работы {index + 1}</span>
                  <button
                    onClick={() => removeWorkExperience(work.id)}
                    className="text-red-500 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={work.company}
                    onChange={(e) => updateWorkExperience(work.id, "company", e.target.value)}
                    className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#ff6b00] focus:border-[#ff6b00] transition-colors"
                    placeholder="Компания"
                  />
                  <input
                    type="text"
                    value={work.position}
                    onChange={(e) => updateWorkExperience(work.id, "position", e.target.value)}
                    className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#ff6b00] focus:border-[#ff6b00] transition-colors"
                    placeholder="Должность"
                  />
                  <input
                    type="month"
                    value={work.start_date}
                    onChange={(e) => updateWorkExperience(work.id, "start_date", e.target.value)}
                    className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-[#ff6b00] focus:border-[#ff6b00] transition-colors [color-scheme:dark]"
                  />
                  <input
                    type="month"
                    value={work.end_date}
                    onChange={(e) => updateWorkExperience(work.id, "end_date", e.target.value)}
                    disabled={work.is_current}
                    className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-[#ff6b00] focus:border-[#ff6b00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed [color-scheme:dark]"
                  />
                </div>
                <label className="flex items-center gap-2 mt-4 cursor-pointer w-max">
                  <input
                    type="checkbox"
                    checked={work.is_current}
                    onChange={(e) => updateWorkExperience(work.id, "is_current", e.target.checked)}
                    className="w-4 h-4 rounded bg-white/5 border-white/10 text-[#ff6b00] focus:ring-[#ff6b00] focus:ring-offset-gray-900 cursor-pointer"
                  />
                  <span className="text-sm text-gray-300">По настоящее время</span>
                </label>
                <textarea
                  value={work.description}
                  onChange={(e) => updateWorkExperience(work.id, "description", e.target.value)}
                  rows={2}
                  className="w-full mt-4 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#ff6b00] focus:border-[#ff6b00] transition-colors resize-none"
                  placeholder="Обязанности и достижения"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Education */}
      <div className="bg-[#1f2833]/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Образование</h2>
          <button
            onClick={addEducation}
            className="text-sm text-[#00f0ff] hover:text-[#00f0ff]/80 font-medium transition-colors"
          >
            + Добавить
          </button>
        </div>

        {resume.education.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">Нет записей об образовании</p>
        ) : (
          <div className="space-y-6">
            {resume.education.map((edu, index) => (
              <div key={edu.id} className="bg-black/20 border border-white/10 rounded-xl p-5">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-medium text-gray-400">Образование {index + 1}</span>
                  <button
                    onClick={() => removeEducation(edu.id)}
                    className="text-red-500 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => updateEducation(edu.id, "institution", e.target.value)}
                    className="col-span-1 md:col-span-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#ff6b00] focus:border-[#ff6b00] transition-colors"
                    placeholder="Учебное заведение"
                  />
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                    className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#ff6b00] focus:border-[#ff6b00] transition-colors"
                    placeholder="Степень (бакалавр, магистр)"
                  />
                  <input
                    type="text"
                    value={edu.field}
                    onChange={(e) => updateEducation(edu.id, "field", e.target.value)}
                    className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#ff6b00] focus:border-[#ff6b00] transition-colors"
                    placeholder="Специальность"
                  />
                  <input
                    type="number"
                    value={edu.start_year}
                    onChange={(e) => updateEducation(edu.id, "start_year", e.target.value)}
                    className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#ff6b00] focus:border-[#ff6b00] transition-colors"
                    placeholder="Год начала"
                  />
                  <input
                    type="number"
                    value={edu.end_year}
                    onChange={(e) => updateEducation(edu.id, "end_year", e.target.value)}
                    className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#ff6b00] focus:border-[#ff6b00] transition-colors"
                    placeholder="Год окончания"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl text-sm border ${message.type === "success"
            ? "bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20"
            : "bg-red-500/10 text-red-400 border-red-500/20"
          }`}>
          {message.text}
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] text-white font-medium rounded-xl hover:shadow-[0_0_15px_rgba(255,107,0,0.4)] transition-all duration-300 disabled:opacity-50 mt-4"
      >
        {saving ? "Сохранение..." : "Сохранить параметры"}
      </button>
    </div>
  );
}
