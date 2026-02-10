// TypeScript interfaces for Resume Builder
// Адаптировано для российского рынка труда

export interface PersonalInfo {
  first_name: string;
  last_name: string;
  middle_name?: string; // Отчество
  birth_date?: string; // YYYY-MM-DD
  photo_url?: string;
  gender?: "male" | "female" | null;
}

export interface Contacts {
  email: string;
  phone: string;
  city: string;
  telegram?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  ready_to_relocate: boolean;
  employment_type: EmploymentType[];
}

// Типы занятости для российского рынка
export type EmploymentType =
  | "full" // Полный день
  | "part" // Частичная занятость
  | "contract" // Контракт
  | "temporary" // Временная работа
  | "internship" // Стажировка
  | "project" // Проектная работа
  | "volunteer" // Волонтерство
  | "remote"; // Удаленная работа

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  start_date: string; // YYYY-MM
  end_date?: string; // YYYY-MM или null если текущее место
  is_current: boolean;
  description: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: EducationDegree;
  field: string; // Специальность
  start_year: string; // YYYY
  end_year?: string; // YYYY или null если учитесь
}

// Уровни образования для российского рынка
export type EducationDegree =
  | "secondary" // Среднее
  | "vocational" // Среднее специальное
  | "incomplete_higher" // Неоконченное высшее
  | "bachelor" // Бакалавр
  | "specialist" // Специалист
  | "master" // Магистр
  | "phd"; // PhD / Кандидат наук

export interface Language {
  id?: string;
  language: string;
  level: LanguageLevel;
}

// Уровни владения языками (CEFR)
export type LanguageLevel =
  | "A1" // Элементарный
  | "A2" // Базовый
  | "B1" // Средний
  | "B2" // Средне-продвинутый
  | "C1" // Продвинутый
  | "C2" // В совершенстве
  | "native"; // Родной

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date?: string; // YYYY-MM или MMMM YYYY
}

export interface Resume {
  id?: string;
  user_id?: string;
  guest_id?: string;

  // Основная информация
  personal_info: PersonalInfo;
  contacts: Contacts;
  desired_position: string;
  desired_salary?: string;

  // Секции
  experience: WorkExperience[];
  education: Education[];
  skills: string;
  languages: Language[];
  achievements?: Achievement[];
  about: string;

  // Метаданные
  template_id: TemplateId;
  ats_score?: number;
  created_at?: string;
  updated_at?: string;
}

// Доступные шаблоны резюме
export type TemplateId = "modern" | "classic" | "ats" | "creative";

export interface Template {
  id: TemplateId;
  name_ru: string;
  description: string;
  preview_url?: string;
  is_premium: boolean;
}

// AI улучшение ответ
export interface AIImproveResponse {
  improved_text: string;
  suggestions: string[];
  ats_keywords: string[];
  explanation?: string;
}

// Пустое резюме для инициализации
export const createEmptyResume = (guestId?: string): Resume => ({
  guest_id: guestId,
  personal_info: {
    first_name: "",
    last_name: "",
    middle_name: "",
  },
  contacts: {
    email: "",
    phone: "",
    city: "",
    ready_to_relocate: false,
    employment_type: [],
  },
  desired_position: "",
  desired_salary: "",
  experience: [],
  education: [],
  skills: "",
  languages: [],
  achievements: [],
  about: "",
  template_id: "modern",
});

// Типы для API
export interface ResumeAPIResponse {
  resume: Resume;
  resume_id?: string;
}

export interface ResumeListResponse {
  resumes: Resume[];
  primary_resume_id?: string;
}

// Опции для типов занятости (для UI select)
export const EMPLOYMENT_TYPE_OPTIONS: { value: EmploymentType; label: string }[] = [
  { value: "full", label: "Полный день" },
  { value: "part", label: "Частичная занятость" },
  { value: "contract", label: "Контракт" },
  { value: "temporary", label: "Временная работа" },
  { value: "internship", label: "Стажировка" },
  { value: "project", label: "Проектная работа" },
  { value: "volunteer", label: "Волонтерство" },
  { value: "remote", label: "Удаленная работа" },
];

// Опции для уровней образования
export const EDUCATION_DEGREE_OPTIONS: { value: EducationDegree; label: string }[] = [
  { value: "secondary", label: "Среднее" },
  { value: "vocational", label: "Среднее специальное" },
  { value: "incomplete_higher", label: "Неоконченное высшее" },
  { value: "bachelor", label: "Бакалавр" },
  { value: "specialist", label: "Специалист" },
  { value: "master", label: "Магистр" },
  { value: "phd", label: "PhD / Кандидат наук" },
];

// Опции для уровней языков
export const LANGUAGE_LEVEL_OPTIONS: { value: LanguageLevel; label: string }[] = [
  { value: "A1", label: "A1 - Элементарный" },
  { value: "A2", label: "A2 - Базовый" },
  { value: "B1", label: "B1 - Средний" },
  { value: "B2", label: "B2 - Средне-продвинутый" },
  { value: "C1", label: "C1 - Продвинутый" },
  { value: "C2", label: "C2 - В совершенстве" },
  { value: "native", label: "Родной" },
];

// Доступные шаблоны
export const TEMPLATES: Template[] = [
  {
    id: "modern",
    name_ru: "Современный",
    description: "Чистый и современный дизайн с акцентом на навыки",
    is_premium: false,
  },
  {
    id: "classic",
    name_ru: "Классический",
    description: "Традиционный формат для консервативных работодателей",
    is_premium: false,
  },
  {
    id: "ats",
    name_ru: "ATS-оптимизированный",
    description: "Максимально совместим с системами автоматического отбора",
    is_premium: false,
  },
  {
    id: "creative",
    name_ru: "Креативный",
    description: "Выразительный дизайн для IT и креативных профессий",
    is_premium: true,
  },
];
