# AI Working Search

## Что это
Платформа для поиска работы в РФ. ИИ парсит вакансии с разных сайтов (Avito, hh, SuperJob и др.), фильтрует мусор и дубликаты, выдаёт пользователю только релевантные вакансии.

## Боль которую решаем
- Искать работу бесит — куча мусора, курьеры, фейки
- Одинаковые вакансии на разных сайтах
- Нужно сидеть часами на hh, avito и т.д.

## MVP
1. Лендинг (сделан)
2. Регистрация (сделан - Supabase Email + Password + Google)
3. Чат с ИИ — уточняет город, сферу, опыт, что не предлагать (сделан)
4. Парсинг вакансий + фильтрация (сделан - backend)
5. Выдача релевантных вакансий (сделан)
6. Лента вакансий /vacancies (сделан)
7. МАССОВЫЙ парсинг HH/SuperJob каждые 2 часа (сделан)
   - 50 запросов за сеанс
   - ~100 городов в mapping
   - ~5,000-10,000 вакансий за сеанс
   - Human-like поведение (умные задержки, микропаузы)
   - **Автофильтр военной тематики** (БПЛА, военнослужащий, армия, etc.)
8. Парсинг Avito ОТКЛЮЧЕН (слишком агрессивные блокировки)
9. Верификация вакансий каждый час (сделан)
10. **AI модерация контента каждый час** (сделан) 🔥
   - **Умная приоритизация**: новые вакансии (24ч) → старые непроверенные
   - AI анализирует заголовок + описание
   - Автоматически деактивирует запрещённый контент (военная тематика)
   - Батчами по 50 вакансий (до 500 проверок за раз)
   - Отслеживание прогресса: `moderation_checked_at` в БД
   - Постепенно проверит все 20,000+ вакансий (по 500 в час)
   - Статистика остатка: сколько ещё непроверенных
11. Создание вакансий работодателями /vacancies/create (сделан)
12. Статистика вакансий: наши / из сети / всего (сделан)
13. Фильтрация по источнику: Наши / В сети / Все (сделан)
14. Страница деталей вакансии /vacancies/[id] (сделан)
15. Управление своими вакансиями /vacancies/my (сделан)
16. Редактирование вакансий /vacancies/edit/[id] (сделан)
17. Чат между соискателями и работодателями /messages (сделан)
18. Админ-панель /admin (сделан)
    - Управление пользователями (бан, роль, подписки, вакансии)
    - **Управление бонусными запросами** (добавление +N или уменьшение -N, просмотр текущего состояния, защита от отрицательных значений)
    - Чаты поддержки с рейтингами и архивом
    - Настройки сайта
    - Управление парсингом (scheduler)
    - **Модерация вакансий работодателей** (на рассмотрении + отклоненные)
19. Next.js API Routes для вакансий работодателей (сделан)
20. Система подписок с YooKassa (сделан)
21. Трёхуровневая система подписок (сделан) ✅
    - **Pro Trial**: 7 дней при регистрации, 15 запросов/день, полный доступ (лента + сеть)
    - **Base**: бесплатно навсегда, 3 запроса/день, только поиск в ленте
    - **Pro**: 799₽/мес, 15 запросов/день, полный доступ (лента + сеть), докупка запросов
    - Автоматический переход Pro Trial → Base после истечения
    - Модалка при истечении Pro Trial (показ 1 раз в 24 часа)
    - Disable toggle "В сети" для Base плана
    - Backend ограничивает search_online для Base
    - Обновлённый лендинг с 3 карточками планов
21. Счётчик запросов в чате (сделан)
22. Плавающий AI-чат с полным функционалом (сделан)
    - Home view с историей чатов и кнопкой "Новый чат"
    - Полноценный чат с AI и input полем
    - Быстрые вопросы-подсказки над input
    - AI определяет запрос к админу и автоматически подключает
23. Связь с администрацией через чат поддержки (сделан)
24. Админ-панель: раздел чатов поддержки + архив + рейтинги (сделан)
25. **AI модерация вакансий работодателей** (сделан) 🔥
    - При нажатии "Опубликовать" → AI проверяет вакансию
    - Проверка на: военную тематику, мошенничество, цензуру, нерелевантность
    - Автоматическое одобрение или отклонение с причиной
    - Отклоненные вакансии → админ-панель для ручной проверки
    - Админ может одобрить/отклонить вручную
    - Статусы: draft, pending_review, published, rejected
26. **Автодеплой через GitHub Actions + уведомления** (сделан) 🚀
    - Zero-downtime deployment с PM2
    - При пуше в main → автоматический деплой на VDS
    - Старая версия работает пока новая не запустится
    - Уведомление пользователям об обновлении (правый верхний угол)
    - Проверка версии каждые 30 сек
    - Кнопка "Обновить сейчас" для перезагрузки страницы

## Стек

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase (Auth + DB)

### Backend (Python - только AI и парсинг)
- Python 3.12
- FastAPI
- OpenRouter API (Claude Sonnet 4.5)
- httpx + BeautifulSoup (парсинг)
- APScheduler (автопарсинг)
- Путь: `backend/`
- **Только**: AI чат для поиска вакансий, парсеры, scheduler

### Next.js API Routes (всё остальное)
- **Лента вакансий** (/api/vacancies/feed, /api/vacancies/stats)
- Админка (/api/admin/*)
- Подписки (/api/subscription/*)
- Чат поддержки (/api/support/*)
- Вакансии работодателей (/api/employer/*)
- Модерация вакансий (/api/admin/employer-vacancies/*)

## Архитектура AI

### Упрощенная схема работы
Система работает в 6 простых шагов:

1. **Извлечение параметров** (ParamExtractor)
   - Пользователь пишет запрос
   - AI извлекает: город, профессию, зарплату, опыт
   - Дополняет данные из профиля пользователя если нужно

2. **Проверка полноты**
   - Если не хватает данных (город/профессия) → задаёт уточняющий вопрос
   - Если всё готово → переход к поиску

3. **Генерация вариантов запросов**
   - AI генерирует 3-6 вариантов поискового запроса
   - Пример: "ПВЗ" → ["пункт выдачи", "менеджер пвз", "оператор пвз", "пункт выдачи Wildberries"]

4. **Поиск вакансий** (VacancySearch)
   - Запускает поиск по API платформ (HH, SuperJob) с фильтрами
   - Сначала ищет в БД, потом дополняет live-парсингом если нужно
   - Возвращает список вакансий

5. **AI Валидация** (Validator)
   - AI читает: заголовок, описание, город каждой вакансии
   - Оценивает подходит/не подходит по запросу пользователя (confidence score)
   - Отсеивает нерелевантные

6. **Результат**
   - Готовый список релевантных вакансий пользователю
   - Отсеянные вакансии сохраняются отдельно

### Компоненты

**ParamExtractor** (`agents/param_extractor.py`)
- Извлекает параметры поиска из сообщения пользователя
- Генерирует варианты поисковых запросов

**VacancySearch** (`tools/search.py`)
- Поиск в БД (Supabase)
- Live-парсинг с сайтов (HH, SuperJob)
- Дедупликация и балансировка результатов

**Validator** (`agents/validator.py`)
- AI-валидация с confidence scoring
- Фильтрация по городу, исключениям, зарплате
- **Автофильтр военной тематики**: БПЛА, военнослужащий, военкомат, армия и т.д.
- Retry логика: 3 попытки с задержкой (1s, 2s, 4s)
- Fallback: при ошибке API возвращает вакансии с confidence 0.5
- Защита стрима: try-catch на всех уровнях (validator + chat.py)

**ContentModerator** (`agents/content_moderator.py`)
- AI модерация контента вакансий из сети (scheduler)
- Проверяет заголовок + описание на запрещённый контент
- Автоматически фильтрует военную тематику
- Батчи по 50 вакансий для оптимизации API вызовов
- Fallback: при ошибке API одобряет все вакансии (чтобы не потерять легитимные)
- Используется scheduler для проверки раз в час

**EmployerVacancyModerator** (`agents/employer_vacancy_moderator.py`)
- AI модерация вакансий работодателей (при публикации)
- Проверяет: военная тематика, мошенничество, цензура, нерелевантность
- Автоматическое одобрение или отклонение с причиной от AI
- При ошибке API → одобряет (админ проверит вручную)
- Используется при нажатии кнопки "Опубликовать"

**Парсеры** (`tools/parsers/`)
- hh.ru (API) — до 200 вакансий за запрос, ~100 городов
- SuperJob (веб-скрапинг) — до 200 вакансий за запрос, ~100 городов
- Avito (веб-скрапинг) — человекоподобное поведение:
  - **Live-поиск**: лимит 20 вакансий, timeout 180 сек (защита от SSE timeout)
  - **Scheduler**: лимит 200 вакансий (для фонового парсинга)
  - Начальная пауза 2-4 сек (загрузка страницы)
  - Задержка 7-10 сек между вакансиями (имитация чтения)
  - Каждую 5-ю вакансию — пауза 20-30 сек (отвлёкся)
  - 10% вакансий быстро пролистываются (1.5-3 сек)
  - 30% — случайный порядок просмотра
  - Ротация User-Agent
  - **Scheduler**: ОТКЛЮЧЕН (слишком агрессивно для массового парсинга)
  - **AI-чат live**: ВКЛЮЧЕН с ограничениями (20 вакансий max)

## Структура проекта
```
src/                          # Frontend (Next.js)
├── app/
│   ├── page.tsx              # Лендинг
│   ├── auth/page.tsx         # Авторизация
│   ├── chat/page.tsx         # Чат с ИИ
│   ├── profile/page.tsx      # Профиль пользователя
│   ├── messages/page.tsx     # Чат с работодателями
│   ├── admin/page.tsx        # Админ-панель
│   ├── api/                  # Next.js API Routes
│   │   ├── version/route.ts  # GET версия приложения (для автодеплоя)
│   │   ├── vacancies/        # Лента вакансий
│   │   │   ├── feed/route.ts         # GET лента (наши + сеть)
│   │   │   └── stats/route.ts        # GET статистика
│   │   ├── admin/            # Админ-панель
│   │   │   ├── stats/route.ts
│   │   │   ├── users/route.ts
│   │   │   ├── users/[userId]/ban/route.ts
│   │   │   ├── users/[userId]/requests/route.ts  # Выдача запросов
│   │   │   ├── settings/route.ts
│   │   │   └── employer-vacancies/   # Модерация вакансий
│   │   │       ├── route.ts          # GET список на модерации
│   │   │       └── [id]/
│   │   │           ├── approve/route.ts
│   │   │           └── reject/route.ts
│   │   ├── subscription/     # Подписки
│   │   │   ├── route.ts              # GET info
│   │   │   ├── checkout/route.ts     # POST create payment
│   │   │   ├── extra/route.ts        # POST buy extra
│   │   │   └── check/[paymentId]/route.ts
│   │   ├── support/          # Чат поддержки
│   │   │   ├── quick-questions/route.ts
│   │   │   ├── ai-chat/route.ts
│   │   │   ├── contact-admin/route.ts
│   │   │   ├── my-chat/route.ts
│   │   │   └── admin/chats/route.ts
│   │   └── employer/
│   │       └── vacancies/
│   │           ├── route.ts           # GET (list), POST (create)
│   │           └── [id]/
│   │               ├── route.ts       # GET, PUT, DELETE
│   │               └── publish/route.ts  # POST (publish)
│   ├── vacancies/
│   │   ├── page.tsx          # Лента вакансий
│   │   ├── create/page.tsx   # Создание вакансии
│   │   ├── edit/[id]/page.tsx # Редактирование вакансии
│   │   ├── my/page.tsx       # Мои вакансии (управление)
│   │   └── [id]/page.tsx     # Детали вакансии
│   └── subscription/
│       ├── page.tsx          # Управление подпиской
│       └── success/page.tsx  # После оплаты
├── components/
│   ├── UpdateNotification.tsx # Уведомление об обновлении (автодеплой)
│   ├── landing/              # Компоненты лендинга
│   │   └── Pricing.tsx       # Секция цен
│   ├── auth/                 # Компоненты авторизации
│   ├── chat/                 # Компоненты чата
│   │   └── FloatingChat.tsx  # Плавающий AI-чат (home/chat/support views)
│   ├── admin/                # Компоненты админки
│   │   ├── SchedulerTab.tsx  # Управление парсингом
│   │   ├── SupportChatTab.tsx # Чаты поддержки
│   │   └── ModerationTab.tsx # Модерация вакансий работодателей
│   ├── profile/              # Компоненты профиля
│   ├── subscription/         # Компоненты подписки
│   │   ├── TrialExpiredModal.tsx
│   │   ├── SubscriptionCard.tsx
│   │   └── SubscriptionProvider.tsx
│   ├── providers/            # Провайдеры
│   │   └── ClientProviders.tsx
│   └── vacancies/            # Компоненты ленты вакансий
│       ├── VacancyFilters.tsx
│       ├── VacancyListCard.tsx
│       ├── VacancyFeed.tsx
│       └── VacancyStats.tsx  # Статистика + фильтр по источнику
└── lib/
    ├── supabase.ts
    ├── useAuth.ts
    ├── useSubscription.ts    # Хук подписки
    └── api.ts                # API клиент

backend/  # Backend (только AI + парсинг)
├── main.py                   # FastAPI app + scheduler startup
├── config.py                 # Настройки (OpenRouter)
├── api/routes/
│   ├── chat.py               # AI чат для поиска вакансий
│   ├── employer_moderation.py # AI модерация вакансий работодателей
│   ├── vacancies.py          # [DEPRECATED] Лента (теперь через Next.js)
│   └── scheduler.py          # Управление scheduler
├── agents/
│   ├── param_extractor.py    # Извлечение параметров из запроса
│   ├── validator.py          # AI валидация вакансий
│   ├── content_moderator.py  # AI модерация сетевых вакансий (военная тематика и т.д.)
│   └── employer_vacancy_moderator.py # AI модерация вакансий работодателей
├── services/
│   ├── vacancy_feed.py       # Сервис ленты (читает из БД + source фильтр)
│   ├── vacancy_storage.py    # CRUD для вакансий в Supabase (+ get_recent_vacancies)
│   ├── employer_vacancy_service.py  # Вакансии работодателей
│   ├── conversation_service.py      # Сервис чатов
│   ├── admin_service.py      # Сервис админки
│   ├── auth_service.py       # JWT авторизация
│   └── subscription_service.py      # Подписки и лимиты запросов
├── scheduler/                # Автопарсинг
│   ├── scheduler.py          # APScheduler (HH/SJ 2ч, верификация 1ч, модерация 1ч)
│   ├── jobs.py               # ParsingJob, AvitoParsingJob, VerificationJob, ModerationJob
│   │                         # Автофильтр военной тематики перед сохранением в БД
│   │                         # AI модерация контента каждый час
│   └── human_behavior.py     # Задержки, UA-ротация, антибан
├── tools/
│   ├── search.py             # Единый поиск (сначала БД, потом live)
│   └── parsers/
│       ├── hh.py
│       ├── avito.py
│       └── superjob.py
└── models/
    ├── vacancy.py
    ├── chat.py
    ├── feed.py
    └── employer_vacancy.py   # Модели вакансий работодателей

supabase/migrations/
├── 001_create_chats.sql
├── 002_add_vacancies_to_messages.sql
├── 003_create_profiles.sql
├── 004_create_resumes.sql
├── 005_create_vacancies_storage.sql  # Хранение вакансий из сети
├── 006_employer_vacancies.sql        # Вакансии работодателей
├── 007_admin_system.sql              # Админ-система (роли, баны, настройки)
├── 008_employer_chat.sql             # Чат соискатель-работодатель
├── 012_subscriptions.sql             # Подписки, лимиты, история платежей
├── 013_support_chat.sql              # Чат поддержки с админами
├── 015_subscription_tiers.sql        # Трёхуровневая система подписок (Pro Trial / Base / Pro)
├── 016_moderation_tracking.sql       # Отслеживание модерации сетевых вакансий
└── 017_employer_vacancy_moderation.sql # Модерация вакансий работодателей
```

## ENV переменные

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
# ВАЖНО: service_role key для Next.js API routes (серверные операции)
SUPABASE_SERVICE_ROLE_KEY=xxx
NEXT_PUBLIC_API_URL=http://localhost:8000

# YooKassa (платежи через Next.js API routes)
YOOKASSA_SHOP_ID=xxx
YOOKASSA_SECRET_KEY=xxx
YOOKASSA_RETURN_URL=https://jobaisearch.ru/subscription/success
```

### Backend (.env in backend/)
```
OPENROUTER_API_KEY=sk-or-xxx
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
MODEL_NAME=anthropic/claude-sonnet-4-5-20250514
SUPABASE_URL=xxx
# ВАЖНО: Используй service_role key (НЕ anon key)!
# service_role обходит RLS, нужен для админ-операций
# Supabase Dashboard → Settings → API → service_role
SUPABASE_KEY=service_role_key_here

DEBUG=true
CORS_ORIGINS=["http://localhost:3000"]
```

## Запуск

### Frontend
```bash
npm run dev
```

### Backend
```bash
cd backend/JobAISeacrh_Backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

## Правила для Claude
Важное правило! Постоянно менять этот файл если есть изменения в архитектуре проекта и его идеях! Этот файл твоя настройка!

### Организация кода
- **Разбивай код на файлы** — не пиши всё в один файл
- **Группируй компоненты по папкам** — landing/, ui/, shared/, chat/ и т.д.
- **Один компонент = один файл** — исключение: мелкие внутренние компоненты
- **Максимум 150-200 строк на файл** — если больше, разбивай

### Стиль кода
- Tailwind CSS для стилей (frontend)
- TypeScript строгий режим (frontend)
- Python type hints (backend)
- Функциональные компоненты
- Именование: PascalCase для компонентов, camelCase/snake_case для функций

### Что НЕ делать
- Не добавлять фичи без запроса
- Не создавать лишние абстракции
- Не писать комментарии к очевидному коду

---

## Деплой

Подробная инструкция по деплою на VDS (Windows Server):
- Домен: `jobaisearch.ru`
- См. файл: `DEPLOY.md`

### CI/CD (Автодеплой)
- **GitHub Actions** при пуше в `main`
- **PM2** для zero-downtime reload (вместо NSSM)
- Конфигурация: [ecosystem.config.js](ecosystem.config.js)
- Workflow: [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
- **Старый сайт работает пока новый не запустится**
- Уведомление пользователям об обновлении (каждые 30 сек проверка версии)
- API версии: `/api/version` (читает файл `.version`)

### Ключевые моменты деплоя
- **PM2** для zero-downtime deployment (Frontend: 2 инстанса cluster, Backend: 1 инстанс)
- Nginx как reverse proxy (80/443 → 3000/8000)
- SSL через win-acme (Let's Encrypt)
- Автоперезапуск при падении через PM2
- SSH доступ для GitHub Actions (OpenSSH Server)

### CLI Мониторинг сервера
Интерактивный CLI инструмент для мониторинга и управления сервером.

**Запуск:**
```bash
# В новом окне
start-monitor.bat

# Или через npm
npm run monitor

# Диагностика проблем
npm run diagnose
```

**Возможности:**
- Статус Frontend/Backend в реальном времени
- Перезапуск сервисов (PM2 reload)
- Git pull + rebuild одной кнопкой
- Просмотр логов
- Автообновление каждые 5 сек

**Команды в мониторе:**
| Клавиша | Действие |
|---------|----------|
| `1` | Перезапустить Frontend |
| `2` | Перезапустить Backend |
| `3` | Перезапустить всё |
| `4` | Git pull + Rebuild |
| `5` | Логи Frontend |
| `6` | Логи Backend |
| `R` | Обновить статус |
| `S` | Остановить всё |
| `Q` | Выход |

**Файлы:**
- `cli/monitor.js` - основной CLI монитор
- `cli/diagnose.js` - диагностика проблем
- `start-monitor.bat` - запуск в новом окне

### Система подписок (трёхуровневая)

| План | Длительность | Запросы/день | Поиск в ленте | Поиск в сети | Докупка | Цена |
|------|--------------|--------------|---------------|--------------|---------|------|
| **Pro Trial** | 7 дней (при регистрации) | 15 | ✓ | ✓ | ✗ | 0₽ |
| **Base** | Навсегда | 3 | ✓ | ✗ | ✗ | 0₽ |
| **Pro** | Месяц | 15 | ✓ | ✓ | ✓ (99₽/10шт) | 799₽/мес |

**Переходы между планами:**
```
Регистрация → Pro Trial (7 дней)
                   ↓ (истёк)
              Base (навсегда) ← показать модальное окно
                   ↓ (оплата)
                  Pro ← ↻ (продление)
```

**Frontend:**
- Лендинг: 3 карточки планов ([Pricing.tsx](src/components/landing/Pricing.tsx))
- Модалка истечения Pro Trial (показывается раз в 24 часа для Base плана)
- Toggle "В сети" disabled для Base с tooltip "Доступно в Pro подписке"
- Типы: `is_pro_trial`, `is_base`, `is_pro`, `is_pro_trial_expired`
- Цвета: Pro Trial (фиолетовый), Base (серый), Pro (синий)

**Backend:**
- HTTP 402 при превышении лимита
- `can_search_online: false` для Base плана (принудительно в [chat.py:237-240](backend/api/routes/chat.py#L237-L240))
- Админ-чат: приоритет Pro > Pro Trial > Base
- Миграция: `015_subscription_tiers.sql` (добавлено поле `can_search_online`)
