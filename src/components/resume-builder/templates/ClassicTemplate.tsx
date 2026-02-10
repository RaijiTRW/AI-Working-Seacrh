"use client";

import { Resume } from "@/types/resume";

interface ClassicTemplateProps {
  resume: Resume;
}

export function ClassicTemplate({ resume }: ClassicTemplateProps) {
  const formatDate = (date: string) => {
    if (!date) return "";
    const [year, month] = date.split("-");
    const months = [
      "января", "февраля", "марта", "апреля", "мая", "июня",
      "июля", "августа", "сентября", "октября", "ноября", "декабря"
    ];
    return `${parseInt(month)} ${months[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div className="p-8 text-sm leading-relaxed text-gray-900">
      {/* Header - Centered */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
          {resume.personal_info.last_name?.toUpperCase()} {resume.personal_info.first_name}
          {resume.personal_info.middle_name && ` ${resume.personal_info.middle_name}`}
        </h1>
        {resume.desired_position && (
          <p className="text-base text-gray-700 font-medium mt-2">
            {resume.desired_position}
          </p>
        )}
        <div className="flex justify-center gap-4 mt-3 text-xs text-gray-600">
          {resume.contacts.email && <span>{resume.contacts.email}</span>}
          {resume.contacts.phone && <span>{resume.contacts.phone}</span>}
          {resume.contacts.city && <span>{resume.contacts.city}</span>}
        </div>
      </div>

      <div className="border-b border-gray-300 mb-4"></div>

      {/* About */}
      {resume.about && (
        <div className="mb-5">
          <h2 className="text-xs font-bold text-gray-900 mb-2 uppercase border-b border-gray-400 inline-block pr-4">
            Сведения о себе
          </h2>
          <p className="text-gray-700 text-justify">{resume.about}</p>
        </div>
      )}

      {/* Experience */}
      {resume.experience.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold text-gray-900 mb-3 uppercase border-b border-gray-400 inline-block pr-4">
            Опыт работы
          </h2>
          {resume.experience.map((exp) => (
            <div key={exp.id} className="mb-4 last:mb-0">
              <div className="flex items-baseline mb-1">
                <h3 className="font-bold text-gray-900">{exp.position}</h3>
                <span className="text-gray-500 mx-2">|</span>
                <span className="text-gray-700 italic">{exp.company}</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                {formatDate(exp.start_date)} — {exp.is_current ? "настоящее время" : formatDate(exp.end_date || "")}
              </p>
              {exp.description && (
                <p className="text-gray-700 text-xs text-justify whitespace-pre-line">{exp.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {resume.education.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold text-gray-900 mb-3 uppercase border-b border-gray-400 inline-block pr-4">
            Образование
          </h2>
          {resume.education.map((edu) => (
            <div key={edu.id} className="mb-3 last:mb-0">
              <p className="font-semibold text-gray-900">{edu.institution}</p>
              <p className="text-gray-700 text-xs">
                {edu.degree} по специальности "{edu.field}"
                {edu.start_year && ` • ${edu.start_year}`}
                {edu.end_year && ` — ${edu.end_year}`}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {resume.skills && (
        <div className="mb-5">
          <h2 className="text-xs font-bold text-gray-900 mb-2 uppercase border-b border-gray-400 inline-block pr-4">
            Профессиональные навыки
          </h2>
          <p className="text-gray-700 text-xs text-justify whitespace-pre-line">{resume.skills}</p>
        </div>
      )}

      {/* Languages */}
      {resume.languages.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold text-gray-900 mb-2 uppercase border-b border-gray-400 inline-block pr-4">
            Владение языками
          </h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {resume.languages.map((lang, idx) => (
              <p key={idx} className="text-gray-700">
                <span className="font-medium">{lang.language}</span> — {lang.level}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Additional info */}
      {(resume.desired_salary || resume.contacts.ready_to_relocate) && (
        <div className="mt-6 pt-4 border-t border-gray-300 text-xs text-gray-600">
          {resume.desired_salary && (
            <p className="mb-1">Ожидаемая заработная плата: {resume.desired_salary} ₽</p>
          )}
          {resume.contacts.ready_to_relocate && (
            <p>Готов к переезду</p>
          )}
        </div>
      )}
    </div>
  );
}
