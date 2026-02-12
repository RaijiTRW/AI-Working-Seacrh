/**
 * API клиент для работы с бэкендом
 *
 * @deprecated Этот файл оставлен для обратной совместимости.
 * Новые импорты лучше делать напрямую из модулей:
 * import { sendMessage } from '@/lib/api/chat'
 * вместо
 * import { sendMessage } from '@/lib/api'
 *
 * API разбит на модули для уменьшения времени анализа TypeScript:
 * - chat.ts - AI поиск вакансий
 * - vacancies.ts - Feed, Employer Vacancies
 * - admin.ts - Admin API (users, settings, moderation)
 * - scheduler.ts - Scheduler API
 * - agents.ts - AI Agents & Support Chat
 * - conversations.ts - Чаты между работодателями и соискателями
 * - subscription.ts - Подписки
 */

export * from './api/index';
