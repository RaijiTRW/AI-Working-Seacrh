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
7. Автоматический парсинг HH/SuperJob каждые 2 часа (сделан)
8. Автоматический парсинг Avito каждые 4 часа (щадящий режим)
9. Верификация вакансий каждый час (сделан)
10. Создание вакансий работодателями /vacancies/create (сделан)
11. Статистика вакансий: наши / из сети / всего (сделан)
12. Фильтрация по источнику: Наши / В сети / Все (сделан)
13. Страница деталей вакансии /vacancies/[id] (сделан)
14. Управление своими вакансиями /vacancies/my (сделан)
15. Редактирование вакансий /vacancies/edit/[id] (сделан)
16. Чат между соискателями и работодателями /messages (сделан)
17. Админ-панель /admin (сделан)
18. Next.js API Routes для вакансий работодателей (сделан)

## Стек

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase (Auth + DB)

### Backend (отдельный репозиторий)
- Python 3.12
- FastAPI
- OpenRouter API (Claude Sonnet 4.5)
- httpx + BeautifulSoup (парсинг)
- APScheduler (автопарсинг)
- Путь: `backend/JobAISeacrh_Backend/`

## Архитектура AI

### Агенты
1. **Orchestrator** — главный агент, управляет потоком
2. **Validator** — фильтрует нерелевантные вакансии

### Tools (Инструменты)
- `search_vacancies` — единый поиск по всем площадкам

### Парсеры
- hh.ru (API)
- Avito (веб-скрапинг)
- SuperJob (веб-скрапинг)

### Поток
1. Пользователь пишет запрос
2. Orchestrator извлекает предпочтения (город, сфера, зп, опыт)
3. Если не хватает инфы — задаёт уточняющие вопросы
4. Когда готов — вызывает search_vacancies
5. Validator фильтрует мусор
6. Ответ + карточки вакансий

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
│   │   └── employer/
│   │       └── vacancies/
│   │           ├── route.ts           # GET (list), POST (create)
│   │           └── [id]/
│   │               ├── route.ts       # GET, PUT, DELETE
│   │               └── publish/route.ts  # POST (publish)
│   └── vacancies/
│       ├── page.tsx          # Лента вакансий
│       ├── create/page.tsx   # Создание вакансии
│       ├── edit/[id]/page.tsx # Редактирование вакансии
│       ├── my/page.tsx       # Мои вакансии (управление)
│       └── [id]/page.tsx     # Детали вакансии
├── components/
│   ├── landing/              # Компоненты лендинга
│   ├── auth/                 # Компоненты авторизации
│   ├── chat/                 # Компоненты чата
│   ├── profile/              # Компоненты профиля
│   └── vacancies/            # Компоненты ленты вакансий
│       ├── VacancyFilters.tsx
│       ├── VacancyListCard.tsx
│       ├── VacancyFeed.tsx
│       └── VacancyStats.tsx  # Статистика + фильтр по источнику
└── lib/
    ├── supabase.ts
    ├── useAuth.ts
    └── api.ts                # API клиент

backend/JobAISeacrh_Backend/  # Backend (separate repo)
├── main.py                   # FastAPI app + scheduler startup
├── config.py                 # Настройки (OpenRouter)
├── api/routes/
│   ├── chat.py               # Эндпоинты чата с ИИ
│   ├── vacancies.py          # Эндпоинты ленты + /stats + source фильтр
│   ├── employer_vacancies.py # CRUD вакансий работодателей
│   ├── conversations.py      # Чат между пользователями
│   └── admin.py              # Админ-панель
├── agents/
│   ├── orchestrator.py       # Главный агент
│   └── validator.py          # Валидация вакансий
├── services/
│   ├── vacancy_feed.py       # Сервис ленты (читает из БД + source фильтр)
│   ├── vacancy_storage.py    # CRUD для вакансий в Supabase
│   ├── employer_vacancy_service.py  # Вакансии работодателей
│   ├── conversation_service.py      # Сервис чатов
│   ├── admin_service.py      # Сервис админки
│   └── auth_service.py       # JWT авторизация
├── scheduler/                # Автопарсинг
│   ├── scheduler.py          # APScheduler (HH/SJ 2ч, Avito 4ч, верификация 1ч)
│   ├── jobs.py               # ParsingJob, AvitoParsingJob, VerificationJob
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
└── 008_employer_chat.sql             # Чат соискатель-работодатель
```

## ENV переменные

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
# ВАЖНО: service_role key для Next.js API routes (серверные операции)
SUPABASE_SERVICE_ROLE_KEY=xxx
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (.env in backend/JobAISeacrh_Backend/)
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
