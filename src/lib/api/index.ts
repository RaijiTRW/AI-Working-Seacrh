/**
 * API модуль - реэкспорты для обратной совместимости
 *
 * Чтобы уменьшить время анализа TypeScript, API разбит на модули:
 * - chat.ts - AI поиск вакансий
 * - vacancies.ts - Feed, Employer Vacancies
 * - admin.ts - Admin API
 * - scheduler.ts - Scheduler API
 * - agents.ts - AI Agents & Support Chat
 * - conversations.ts - Чаты между работодателями и соискателями
 * - subscription.ts - Подписки
 *
 * Старые импорты продолжат работать благодаря этому файлу.
 * Для новой логики лучше импортировать напрямую из модулей:
 * import { sendMessage } from '@/lib/api/chat'
 * вместо
 * import { sendMessage } from '@/lib/api'
 */

// Chat API
export * from './chat';

// Vacancies API
export * from './vacancies';

// Admin API
export * from './admin';

// Scheduler API
export * from './scheduler';

// Agents API
export * from './agents';

// Conversations API
export * from './conversations';

// Subscription API
export * from './subscription';
