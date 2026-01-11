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
│   └── chat/page.tsx         # Чат с ИИ
├── components/
│   ├── landing/              # Компоненты лендинга
│   ├── auth/                 # Компоненты авторизации
│   └── chat/                 # Компоненты чата
│       ├── ChatInput.tsx
│       ├── ChatMessages.tsx
│       ├── ChatListModal.tsx
│       └── VacancyCards.tsx
└── lib/
    ├── supabase.ts
    ├── useAuth.ts
    └── api.ts                # API клиент

backend/JobAISeacrh_Backend/  # Backend (separate repo)
├── main.py                   # FastAPI app
├── config.py                 # Настройки (OpenRouter)
├── api/routes/
│   └── chat.py               # Эндпоинты чата
├── agents/
│   ├── orchestrator.py       # Главный агент
│   └── validator.py          # Валидация вакансий
├── tools/
│   ├── search.py             # Единый поиск
│   └── parsers/
│       ├── hh.py
│       ├── avito.py
│       └── superjob.py
└── models/
    ├── vacancy.py
    └── chat.py

supabase/migrations/          # SQL миграции
└── 001_create_chats.sql
```

## ENV переменные

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (.env in backend/JobAISeacrh_Backend/)
```
OPENROUTER_API_KEY=sk-or-xxx
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
MODEL_NAME=anthropic/claude-sonnet-4-5-20250514
SUPABASE_URL=xxx
SUPABASE_KEY=xxx
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
