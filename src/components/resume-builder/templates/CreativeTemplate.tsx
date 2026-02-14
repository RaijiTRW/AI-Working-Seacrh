"use client";

import { Resume } from "@/types/resume";
import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

// Photo loading state component

interface CreativeTemplateProps {
  resume: Resume;
}

export function CreativeTemplate({ resume }: CreativeTemplateProps) {
  const [imageLoading, setImageLoading] = useState(false);
  const lastPhotoUrl = useRef<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [photoTimestamp, setPhotoTimestamp] = useState(0);

  // Добавляем timestamp к URL чтобы избежать кеширования
  const photoUrlWithTimestamp = resume.personal_info.photo_url
    ? `${resume.personal_info.photo_url}${resume.personal_info.photo_url.includes('?') ? '&' : '?'}t=${photoTimestamp}`
    : null;

  // Показываем лоадер только при изменении URL фото
  useEffect(() => {
    const currentUrl = resume.personal_info.photo_url;

    if (currentUrl && currentUrl !== lastPhotoUrl.current) {
      setImageLoading(true);
      lastPhotoUrl.current = currentUrl;
      setPhotoTimestamp(Date.now()); // Обновляем timestamp для новой фотки

      // Проверяем, загружено ли уже (из кеша)
      const checkLoaded = () => {
        if (imgRef.current?.complete) {
          setImageLoading(false);
        }
      };

      // Проверяем в следующем фрейме
      requestAnimationFrame(checkLoaded);
      setTimeout(checkLoaded, 100);

      // Fallback: скрываем лоадер через 5 секунд
      const fallback = setTimeout(() => {
        setImageLoading(false);
      }, 5000);

      return () => {
        clearTimeout(fallback);
      };
    } else if (!currentUrl) {
      setImageLoading(false);
    }
  }, [resume.personal_info.photo_url]);
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
    <div className="text-sm leading-relaxed text-gray-900" style={{ minHeight: '1123px' }}>
      {/* Header with gradient background */}
      <div className="p-6" style={{ backgroundColor: '#8b5cf6', minHeight: '200px' }}>
        <div className="flex gap-6">
          {/* Photo */}
          {resume.personal_info.photo_url && (
            <div className="flex-shrink-0 relative">
              <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg" style={{ border: '3px solid rgba(255,255,255,0.3)' }}>
                {photoUrlWithTimestamp && (
                  <img
                    ref={imgRef}
                    src={photoUrlWithTimestamp}
                    alt="Photo"
                    className="w-full h-full object-cover"
                    onLoad={() => setImageLoading(false)}
                    onError={() => setImageLoading(false)}
                  />
                )}
              </div>
              {/* Loading overlay */}
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-purple-600/50" style={{ width: '96px', height: '96px', marginLeft: '0' }}>
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
          )}

          {/* Name and Position */}
          <div className="flex-1 text-white" style={{ minHeight: '100px' }}>
            <h1 className="text-2xl font-bold leading-tight" style={{ minHeight: '28px' }}>
              {resume.personal_info.first_name || resume.personal_info.last_name
                ? `${resume.personal_info.first_name} ${resume.personal_info.last_name}`
                : 'Ваше Имя Фамилия'}
            </h1>
            {resume.personal_info.middle_name && (
              <p className="text-sm opacity-80 mt-0.5">{resume.personal_info.middle_name}</p>
            )}
            {resume.desired_position && (
              <p className="text-lg font-medium mt-2">
                {resume.desired_position}
              </p>
            )}
            {resume.desired_salary && (
              <p className="text-base opacity-90 mt-1">
                {resume.desired_salary} ₽
              </p>
            )}
          </div>
        </div>

        {/* Contacts */}
        <div className="flex flex-wrap gap-4 mt-4 text-white text-xs leading-none">
          {resume.contacts.email && (
            <span className="inline-flex items-center gap-1 leading-none">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              {resume.contacts.email}
            </span>
          )}
          {resume.contacts.phone && (
            <span className="inline-flex items-center gap-1 leading-none">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              {resume.contacts.phone}
            </span>
          )}
          {resume.contacts.city && (
            <span className="inline-flex items-center gap-1 leading-none">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {resume.contacts.city}
            </span>
          )}
          {resume.contacts.telegram && (
            <span className="inline-flex items-center gap-1 leading-none">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm3.24 13.5c-.16.45-.47.56-.92.35-1.28-.6-2.96-1.5-5.28-2.52-.48-.22-.67-.55-.27-.94.3-.29.73-.72 1.08-1.08.2-.2.24-.35.08-.58-.34-.5-.7-1-1.08-1.5-.25-.32-.18-.48.18-.48h1.52c.32 0 .42.16.5.4.28.8.58 1.6.88 2.4.12.32.06.52-.18.76-.32.32-.68.66-1.02.98-.2.2-.24.36-.08.6.5.74 1.02 1.46 1.56 2.18.16.22.34.28.6.16.32-.15.64-.3.96-.44.34-.15.54-.06.6.32.06.4.06.8.06 1.2z" />
              </svg>
              @{resume.contacts.telegram}
            </span>
          )}
          {resume.contacts.github && (
            <span className="inline-flex items-center gap-1 leading-none">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 0C4.48 0 0 4.48 0 10c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02a9.56 9.56 0 015 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C17.14 18.16 20 14.42 20 10c0-5.52-4.48-10-10-10z" clipRule="evenodd" />
              </svg>
              {resume.contacts.github}
            </span>
          )}
          {resume.contacts.linkedin && (
            <span className="inline-flex items-center gap-1 leading-none">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
              </svg>
              {resume.contacts.linkedin}
            </span>
          )}
          {resume.contacts.portfolio && (
            <span className="inline-flex items-center gap-1 leading-none">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              {resume.contacts.portfolio}
            </span>
          )}
          {resume.contacts.ready_to_relocate && (
            <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              Готов к переезду
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* About */}
        {resume.about && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide flex items-center gap-2">
              <span className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: '#ede9fe' }}>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#7c3aed' }}>
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </span>
              Обо мне
            </h2>
            <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{resume.about}</p>
          </div>
        )}

        {/* Experience */}
        {resume.experience.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide flex items-center gap-2">
              <span className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: '#ede9fe' }}>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#7c3aed' }}>
                  <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                  <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                </svg>
              </span>
              Опыт работы
            </h2>
            <div className="space-y-3">
              {resume.experience.map((exp, idx) => (
                <div
                  key={exp.id}
                  className="relative pl-5 pb-3"
                  style={idx < resume.experience.length - 1 ? { borderLeft: '2px solid #ddd6fe' } : {}}
                >
                  <div className="absolute left-0 top-0 w-3 h-3 rounded-full" style={{ backgroundColor: '#8b5cf6', transform: 'translateX(-6px)' }} />
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-bold text-gray-900 text-sm">{exp.position}</h3>
                      <span className="inline-flex items-center text-xs leading-none px-2 py-0.5 rounded flex-shrink-0 ml-2" style={{ color: '#7c3aed', backgroundColor: '#f5f3ff' }}>
                        {formatDate(exp.start_date)} — {exp.is_current ? "наст. время" : formatDate(exp.end_date || "")}
                      </span>
                    </div>
                    <p className="font-medium text-sm mb-1" style={{ color: '#7c3aed' }}>{exp.company}</p>
                    {exp.description && (
                      <p className="text-gray-700 text-xs whitespace-pre-line">{exp.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {resume.education.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide flex items-center gap-2">
              <span className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: '#ede9fe' }}>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#7c3aed' }}>
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
              </span>
              Образование
            </h2>
            <div className="space-y-2">
              {resume.education.map((edu) => (
                <div key={edu.id} className="rounded-lg p-3" style={{ backgroundColor: '#f5f3ff' }}>
                  <div className="flex items-baseline justify-between mb-0.5">
                    <p className="font-bold text-gray-900 text-sm">{edu.institution}</p>
                    <span className="inline-flex items-center text-xs leading-none px-2 py-0.5 rounded ml-2 flex-shrink-0" style={{ color: '#7c3aed', backgroundColor: '#ffffff' }}>
                      {edu.start_year} — {edu.end_year || "наст. время"}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm font-medium">{edu.degree}</p>
                  <p className="text-gray-600 text-xs">{edu.field}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {resume.skills && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide flex items-center gap-2">
              <span className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: '#ede9fe' }}>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#7c3aed' }}>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </span>
              Навыки
            </h2>
            <div className="flex flex-wrap gap-2">
              {resume.skills.split(/[,\n]+/).filter(Boolean).map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium leading-none"
                  style={{ backgroundColor: '#ede9fe', color: '#7c3aed' }}
                >
                  {skill.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {resume.languages.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide flex items-center gap-2">
              <span className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: '#ede9fe' }}>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#7c3aed' }}>
                  <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.09 19.09 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.657.79-1.295 1.126-1.917a1 1 0 011.757-.956zM10 14a1 1 0 100-2 1 1 0 000 2zM16 11a1 1 0 01-1 1v1a1 1 0 11-2 0v-1a1 1 0 01-1-1H9a1 1 0 01-1-1V7a1 1 0 011-1h2a1 1 0 011 1v1h2V7a1 1 0 011-1h2a1 1 0 011 1v4z" clipRule="evenodd" />
                </svg>
              </span>
              Языки
            </h2>
            <div className="flex flex-wrap gap-3">
              {resume.languages.map((lang, idx) => (
                <span key={idx} className="inline-flex items-center text-sm text-gray-700">
                  <span className="font-medium">{lang.language}</span>
                  <span className="text-gray-500 mx-1">—</span>
                  <span className="text-gray-600">{lang.level}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
