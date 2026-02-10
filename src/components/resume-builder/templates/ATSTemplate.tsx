"use client";

import { Resume } from "@/types/resume";

interface ATSTemplateProps {
  resume: Resume;
}

export function ATSTemplate({ resume }: ATSTemplateProps) {
  const formatDate = (date: string) => {
    if (!date) return "";
    const [year, month] = date.split("-");
    return `${month}/${year}`;
  };

  return (
    <div className="p-6 text-xs leading-relaxed text-gray-900 font-mono">
      {/* ATS Header - Plain text format */}
      <div className="border-b border-gray-300 pb-3 mb-4">
        <h1 className="text-base font-bold text-gray-900 uppercase">
          {resume.personal_info.last_name?.toUpperCase()}, {resume.personal_info.first_name}
          {resume.personal_info.middle_name && ` ${resume.personal_info.middle_name}`}
        </h1>
        {resume.desired_position && (
          <p className="text-sm text-gray-900 font-semibold mt-1 uppercase">
            {resume.desired_position}
          </p>
        )}
        <div className="mt-2 text-gray-600 space-y-0.5">
          {resume.contacts.email && <p>EMAIL: {resume.contacts.email.toUpperCase()}</p>}
          {resume.contacts.phone && <p>PHONE: {resume.contacts.phone}</p>}
          {resume.contacts.city && <p>LOCATION: {resume.contacts.city.toUpperCase()}</p>}
          {resume.contacts.telegram && <p>TELEGRAM: @{resume.contacts.telegram}</p>}
        </div>
      </div>

      {/* About */}
      {resume.about && (
        <div className="mb-4">
          <h2 className="text-xs font-bold text-gray-900 mb-2 uppercase">
            PROFESSIONAL SUMMARY
          </h2>
          <p className="text-gray-700 text-justify">{resume.about}</p>
        </div>
      )}

      {/* Experience */}
      {resume.experience.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold text-gray-900 mb-2 uppercase">
            WORK EXPERIENCE
          </h2>
          {resume.experience.map((exp) => (
            <div key={exp.id} className="mb-3 last:mb-0">
              <p className="font-bold text-gray-900 uppercase">{exp.position.toUpperCase()}</p>
              <p className="text-gray-700">{exp.company.toUpperCase()}</p>
              <p className="text-gray-500 mb-1">
                {formatDate(exp.start_date)} — {exp.is_current ? "PRESENT" : formatDate(exp.end_date || "")}
              </p>
              {exp.description && (
                <p className="text-gray-700 text-justify whitespace-pre-line">{exp.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {resume.education.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold text-gray-900 mb-2 uppercase">
            EDUCATION
          </h2>
          {resume.education.map((edu) => (
            <div key={edu.id} className="mb-2 last:mb-0">
              <p className="font-bold text-gray-900 uppercase">{edu.institution.toUpperCase()}</p>
              <p className="text-gray-700">
                {edu.degree.toUpperCase()} IN {edu.field.toUpperCase()}
              </p>
              <p className="text-gray-500">
                {edu.start_year} — {edu.end_year || "PRESENT"}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Skills - Keyword optimized */}
      {resume.skills && (
        <div className="mb-4">
          <h2 className="text-xs font-bold text-gray-900 mb-2 uppercase">
            SKILLS
          </h2>
          <p className="text-gray-700 text-justify whitespace-pre-line">{resume.skills.toUpperCase()}</p>
        </div>
      )}

      {/* Languages */}
      {resume.languages.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold text-gray-900 mb-2 uppercase">
            LANGUAGES
          </h2>
          <div className="text-gray-700 space-y-0.5">
            {resume.languages.map((lang, idx) => (
              <p key={idx}>
                {lang.language.toUpperCase()}: {lang.level.toUpperCase()}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Employment Type & Salary */}
      {(resume.contacts.employment_type.length > 0 || resume.desired_salary) && (
        <div className="mt-4 pt-3 border-t border-gray-300 text-xs text-gray-600">
          {resume.contacts.employment_type.length > 0 && (
            <p className="mb-1">
              EMPLOYMENT TYPE: {resume.contacts.employment_type.join(", ").toUpperCase()}
            </p>
          )}
          {resume.desired_salary && (
            <p>SALARY EXPECTATION: {resume.desired_salary} RUB/MONTH</p>
          )}
          {resume.contacts.ready_to_relocate && <p>RELOCATION: AVAILABLE</p>}
        </div>
      )}

      {/* ATS Footer */}
      <div className="mt-4 pt-2 border-t border-gray-200 text-center text-gray-400 text-[10px]">
        END OF RESUME
      </div>
    </div>
  );
}
