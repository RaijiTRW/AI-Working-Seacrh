// LocalStorage wrapper для Resume Builder (Guest mode)
// Позволяет сохранять резюме в браузере для неавторизованных пользователей

import { Resume, createEmptyResume } from "@/types/resume";

const GUEST_ID_KEY = "guest_id";
const RESUME_STORAGE_KEY_PREFIX = "resume_";
const RESUMEautosave_KEY = "resume_autosave_enabled";

/**
 * Генерирует или получает существующий guest_id
 */
export function getOrCreateGuestId(): string {
  if (typeof window === "undefined") return "";

  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
}

/**
 * Сохраняет резюме в localStorage
 */
export function saveGuestResume(resume: Resume): void {
  if (typeof window === "undefined") return;

  const guestId = resume.guest_id || getOrCreateGuestId();
  const key = `${RESUME_STORAGE_KEY_PREFIX}${guestId}`;

  try {
    localStorage.setItem(key, JSON.stringify(resume));
  } catch (error) {
    // Если переполнение localStorage, пробуем очистить старые данные
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      clearOldGuestResumes();
      try {
        localStorage.setItem(key, JSON.stringify(resume));
      } catch (retryError) {
      }
    }
  }
}

/**
 * Получает резюме из localStorage
 */
export function getGuestResume(guestId?: string): Resume | null {
  if (typeof window === "undefined") return null;

  const id = guestId || getOrCreateGuestId();
  const key = `${RESUME_STORAGE_KEY_PREFIX}${id}`;

  try {
    const data = localStorage.getItem(key);
    if (!data) return null;

    const resume = JSON.parse(data) as Resume;
    return resume;
  } catch (error) {
    return null;
  }
}

/**
 * Создает пустое резюме для гостя
 */
export function createGuestResume(): Resume {
  const guestId = getOrCreateGuestId();
  return createEmptyResume(guestId);
}

/**
 * Удаляет резюме из localStorage
 */
export function clearGuestResume(guestId?: string): void {
  if (typeof window === "undefined") return;

  const id = guestId || getOrCreateGuestId();
  const key = `${RESUME_STORAGE_KEY_PREFIX}${id}`;

  localStorage.removeItem(key);
}

/**
 * Полностью очищает все данные guest режима
 */
export function clearAllGuestData(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(GUEST_ID_KEY);
  // Удаляем все резюме
  Object.keys(localStorage)
    .filter((key) => key.startsWith(RESUME_STORAGE_KEY_PREFIX))
    .forEach((key) => localStorage.removeItem(key));
}

/**
 * Очищает старые резюме из localStorage (кроме текущего)
 */
export function clearOldGuestResumes(): void {
  if (typeof window === "undefined") return;

  const currentGuestId = getOrCreateGuestId();
  const currentKey = `${RESUME_STORAGE_KEY_PREFIX}${currentGuestId}`;

  Object.keys(localStorage)
    .filter((key) => key.startsWith(RESUME_STORAGE_KEY_PREFIX) && key !== currentKey)
    .forEach((key) => localStorage.removeItem(key));
}

/**
 * Проверяет, есть ли резюме в localStorage
 */
export function hasGuestResume(guestId?: string): boolean {
  if (typeof window === "undefined") return false;

  const id = guestId || getOrCreateGuestId();
  const key = `${RESUME_STORAGE_KEY_PREFIX}${id}`;
  return localStorage.getItem(key) !== null;
}

/**
 * Включает/выключает автосохранение
 */
export function setAutosaveEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(RESUMEautosave_KEY, enabled.toString());
}

/**
 * Проверяет, включено ли автосохранение
 */
export function isAutosaveEnabled(): boolean {
  if (typeof window === "undefined") return true;

  const value = localStorage.getItem(RESUMEautosave_KEY);
  return value !== "false"; // По умолчанию включено
}

/**
 * Получает размер занимаемого места в localStorage (в байтах)
 */
export function getStorageSize(): number {
  if (typeof window === "undefined") return 0;

  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += key.length + localStorage[key]!.length;
    }
  }
  return total;
}

/**
 * Экспортирует резюме как JSON (для бэкапа)
 */
export function exportResumeAsJSON(resume: Resume): string {
  return JSON.stringify(resume, null, 2);
}

/**
 * Импортирует резюме из JSON
 */
export function importResumeFromJSON(json: string): Resume | null {
  try {
    const resume = JSON.parse(json) as Resume;
    // Базовая валидация
    if (!resume.personal_info || !resume.contacts) {
      throw new Error("Invalid resume format");
    }
    return resume;
  } catch (error) {
    return null;
  }
}

/**
 * Получает время последнего сохранения резюме
 */
export function getLastSavedTime(guestId?: string): Date | null {
  if (typeof window === "undefined") return null;

  const id = guestId || getOrCreateGuestId();
  const key = `${RESUME_STORAGE_KEY_PREFIX}${id}`;

  // Используем try-catch для случаев, когда localStorage недоступен
  try {
    const data = localStorage.getItem(key);
    if (!data) return null;

    const resume = JSON.parse(data) as Resume;
    if (resume.updated_at) {
      return new Date(resume.updated_at);
    }

    // Если updated_at нет, пробуем получить через API timing
    // Но для localStorage это не работает, так что возвращаем null
    return null;
  } catch {
    return null;
  }
}

/**
 * Сохраняет черновик резюме (для auto-save debounce)
 */
let saveTimeout: NodeJS.Timeout | null = null;

export function debouncedSaveResume(resume: Resume, delay: number = 1000): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    saveGuestResume(resume);
  }, delay);
}

/**
 * Отменяет отложенное сохранение
 */
export function cancelPendingSave(): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
}
