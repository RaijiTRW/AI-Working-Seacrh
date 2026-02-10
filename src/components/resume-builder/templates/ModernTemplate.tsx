"use client";

import { Resume } from "@/types/resume";

interface ModernTemplateProps {
  resume: Resume;
}

export function ModernTemplate({ resume }: ModernTemplateProps) {
  const formatDate = (date: string) => {
    if (!date) return "";
    const [year, month] = date.split("-");
    const months = [
      "янв", "фев", "мар", "апр", "май", "июн",
      "июл", "авг", "сен", "окт", "ноя", "дек"
    ];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div className="p-8 text-sm leading-relaxed text-gray-900">
      {/* Header */}
      <div className="border-b-2 border-orange-500 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {resume.personal_info.first_name} {resume.personal_info.last_name}
          {resume.personal_info.middle_name && ` ${resume.personal_info.middle_name}`}
        </h1>
        {resume.desired_position && (
          <p className="text-lg text-orange-600 font-medium mt-1">
            {resume.desired_position}
          </p>
        )}
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-600">
          {resume.contacts.email && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {resume.contacts.email}
            </span>
          )}
          {resume.contacts.phone && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z" />
              </svg>
              {resume.contacts.phone}
            </span>
          )}
          {resume.contacts.city && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {resume.contacts.city}
            </span>
          )}
          {resume.desired_salary && (
            <span className="text-orange-600 font-medium">
              {resume.desired_salary} ₽
            </span>
          )}
        </div>
      </div>

      {/* About */}
      {resume.about && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
            Обо мне
          </h2>
          <p className="text-gray-700">{resume.about}</p>
        </div>
      )}

      {/* Experience */}
      {resume.experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
            Опыт работы
          </h2>
          {resume.experience.map((exp) => (
            <div key={exp.id} className="mb-4 last:mb-0">
              <div className="flex items-baseline justify-between mb-1">
                <h3 className="font-bold text-gray-900">{exp.position}</h3>
                <span className="text-xs text-gray-500 ml-2">
                  {formatDate(exp.start_date)} — {exp.is_current ? "настоящее время" : formatDate(exp.end_date || "")}
                </span>
              </div>
              <p className="text-orange-600 font-medium text-sm mb-1">{exp.company}</p>
              {exp.description && (
                <p className="text-gray-700 text-xs whitespace-pre-line">{exp.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {resume.education.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
            Образование
          </h2>
          {resume.education.map((edu) => (
            <div key={edu.id} className="mb-2 last:mb-0">
              <div className="flex items-baseline justify-between">
                <p className="font-semibold text-gray-900">{edu.institution}</p>
                <span className="text-xs text-gray-500 ml-2">
                  {edu.start_year} — {edu.end_year || "настоящее время"}
                </span>
              </div>
              <p className="text-gray-700 text-xs">
                {edu.degree} • {edu.field}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {resume.skills && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
            Ключевые навыки
          </h2>
          <p className="text-gray-700 text-xs whitespace-pre-line">{resume.skills}</p>
        </div>
      )}

      {/* Languages */}
      {resume.languages.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
            Языки
          </h2>
          <div className="flex flex-wrap gap-2">
            {resume.languages.map((lang, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
              >
                {lang.language} — {lang.level}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
