# Synora — Design Spec
**Date:** 2026-06-13  
**Status:** Approved

---

## Overview

Synora — мобильное AI-приложение для обучения. Пользователь загружает PDF, приложение автоматически генерирует конспекты, flashcards и тесты с помощью Gemini AI. Встроенный AI Tutor отвечает на вопросы по материалу. Поддержка 9 языков с автоопределением языка документа.

**Платформы:** Android + iOS (одна кодовая база)  
**Технологии:** React Native · Expo SDK 52 · TypeScript · Supabase · Google Gemini API

---

## Decisions Made

| Вопрос | Решение |
|--------|---------|
| Платформа | React Native + Expo SDK 52 |
| Backend | Supabase (auth + БД + storage + Edge Functions) |
| AI provider | Google Gemini (Flash для генерации, Pro для чата) |
| AI архитектура | Все AI-запросы через Supabase Edge Functions (ключи на сервере) |
| Local AI | Нет в MVP, запланировано на следующую итерацию |
| Монетизация | Нет в MVP |
| Функции MVP | Все экраны: PDF, конспекты, flashcards, тесты, AI Tutor, прогресс |

---

## Architecture

```
📱 React Native App (Expo Router)
        │
        ├── Supabase JS Client
        │       ├── Auth (email + OAuth)
        │       ├── Database (PostgreSQL)
        │       ├── Storage (pdfs/, avatars/)
        │       └── Edge Functions
        │               ├── process-pdf        → text extraction + language detection
        │               ├── generate-summary   → Gemini 1.5 Flash
        │               ├── generate-flashcards → Gemini 1.5 Flash
        │               ├── generate-exam      → Gemini 1.5 Flash
        │               └── tutor-chat         → Gemini 1.5 Pro
        │
        └── i18next (9 языков, client-side)
```

**Принцип:** API-ключ Gemini хранится только в Supabase Edge Functions (env vars), никогда в мобильном приложении.

---

## Screen Structure (Expo Router)

```
app/
├── (auth)/
│   ├── login.tsx
│   ├── register.tsx
│   └── onboarding.tsx          ← выбор языка интерфейса
│
└── (app)/
    ├── _layout.tsx              ← Tab Bar навигация
    ├── index.tsx                ← Главный экран
    │
    ├── library/
    │   ├── index.tsx            ← Список всех документов
    │   ├── [id].tsx             ← Детали документа (конспект/flashcards/тест)
    │   ├── [id]/notes.tsx       ← Конспект
    │   ├── [id]/flashcards.tsx  ← Режим карточек
    │   └── [id]/exam.tsx        ← Экзамен
    │
    ├── study/
    │   ├── flashcards/[id].tsx  ← Полноэкранный режим flashcards
    │   ├── exam/[id].tsx        ← Режим экзамена
    │   └── exam/[id]/results.tsx ← Результаты экзамена
    │
    ├── tutor/
    │   └── index.tsx            ← AI Tutor чат
    │
    └── progress/
        └── index.tsx            ← Статистика и прогресс
```

**Tab Bar (нижняя навигация):** Главная · Библиотека · AI Tutor · Прогресс

**Главный экран** — 6 быстрых кнопок: Upload PDF · Continue Learning · AI Tutor · Flashcards · Exam Mode · Progress. Максимум 1–2 нажатия до любой функции.

---

## Data Model (Supabase PostgreSQL)

### profiles
```sql
id          uuid  PK (FK → auth.users)
full_name   text
avatar_url  text
language    text  DEFAULT 'en'
created_at  timestamptz
```

### documents
```sql
id                uuid  PK
user_id           uuid  FK → profiles
title             text
file_path         text  (Supabase Storage path)
extracted_text    text  (после обработки)
language_detected text
page_count        int
status            text  -- 'uploading' | 'processing' | 'ready' | 'error'
created_at        timestamptz
```

### summaries
```sql
id          uuid  PK
document_id uuid  FK → documents
content     text
language    text
created_at  timestamptz
```

### flashcard_sets
```sql
id          uuid  PK
document_id uuid  FK → documents
title       text
created_at  timestamptz
```

### flashcard_items
```sql
id         uuid  PK
set_id     uuid  FK → flashcard_sets
question   text
answer     text
difficulty int   -- 1-5
```

### exams
```sql
id          uuid  PK
document_id uuid  FK → documents
title       text
created_at  timestamptz
```

### exam_questions
```sql
id       uuid  PK
exam_id  uuid  FK → exams
question text
options  jsonb  -- string[]
correct  int    -- index в options
```

### exam_attempts
```sql
id         uuid  PK
exam_id    uuid  FK → exams
user_id    uuid  FK → profiles
score      int
answers    jsonb  -- int[] (выбранные индексы)
completed_at timestamptz
```

### tutor_sessions
```sql
id          uuid  PK
user_id     uuid  FK → profiles
document_id uuid  FK → documents (nullable — сессия может быть без документа)
created_at  timestamptz
```

### tutor_messages
```sql
id         uuid  PK
session_id uuid  FK → tutor_sessions
role       text  -- 'user' | 'assistant'
content    text
created_at timestamptz
```

**Storage Buckets:**
- `pdfs/` — приватный, файлы доступны только владельцу через RLS
- `avatars/` — публичный

---

## AI Pipeline

### PDF Processing Flow

1. Пользователь выбирает PDF → `expo-document-picker`
2. Загрузка в `Supabase Storage` → `pdfs/{user_id}/{uuid}.pdf`
3. Запись в `documents` со статусом `'uploading'`
4. Вызов Edge Function `process-pdf`:
   - Скачивает PDF из Storage
   - Извлекает текст (`pdfjs-dist`)
   - Определяет язык (Gemini: короткий промпт "What language is this text?" — без лишних зависимостей)
   - Обновляет `documents`: `extracted_text`, `language_detected`, `status: 'ready'`
5. Приложение подписывается на изменения документа через Supabase Realtime (subscription на `documents` row)

### Edge Functions

| Функция | Модель | Input | Output |
|---------|--------|-------|--------|
| `process-pdf` | — | PDF file path | extracted text + language |
| `generate-summary` | gemini-1.5-flash | text + output_language | markdown summary |
| `generate-flashcards` | gemini-1.5-flash | text + count + output_language | JSON array [{question, answer, difficulty}] |
| `generate-exam` | gemini-1.5-flash | text + count + output_language | JSON array [{question, options[], correct}] |
| `tutor-chat` | gemini-1.5-pro | messages[] + document_context + output_language | assistant message |

### Многоязычность

Каждая AI Edge Function принимает параметр `output_language` (ISO код: `en`, `ru`, `ky`, `kz`, `tr`, `ar`, `de`, `fr`, `es`). Системный промпт явно задаёт язык ответа. Пользователь может выбрать язык вывода отдельно от языка документа.

---

## Tech Stack

### Mobile App
| Категория | Библиотека |
|-----------|------------|
| Framework | Expo SDK 52 + React Native |
| Navigation | expo-router v3 (file-based) |
| Styling | NativeWind v4 (Tailwind CSS) |
| Animations | react-native-reanimated v3 |
| Gestures | react-native-gesture-handler |
| State | zustand |
| Server state | @tanstack/react-query v5 |
| Forms | react-hook-form + zod |
| i18n | i18next + react-i18next |
| PDF picker | expo-document-picker |
| File system | expo-file-system |
| Icons | @expo/vector-icons |

### Backend (Supabase)
| Категория | Технология |
|-----------|------------|
| Auth | Supabase Auth (email/password + Google OAuth) |
| Database | PostgreSQL (Supabase) |
| Storage | Supabase Storage |
| Edge Functions | Deno (TypeScript) |
| AI | @google/generative-ai (Gemini) |
| Realtime | Supabase Realtime (статус обработки PDF) |

### Dev Tools
- TypeScript (strict)
- ESLint + Prettier
- Jest + React Native Testing Library
- Supabase CLI (local development)

---

## Folder Structure

```
synora/
├── app/                          ← Expo Router screens
│   ├── (auth)/
│   └── (app)/
├── components/
│   ├── ui/                       ← Базовые компоненты (Button, Card, Input...)
│   ├── document/                 ← DocumentCard, DocumentStatus...
│   ├── flashcard/                ← FlashcardStack, FlashcardItem...
│   ├── exam/                     ← ExamQuestion, ExamResults...
│   └── tutor/                    ← TutorMessage, TutorInput...
├── lib/
│   └── supabase.ts               ← Supabase client (единственный выход наружу)
├── hooks/
│   ├── useDocuments.ts
│   ├── useFlashcards.ts
│   ├── useExam.ts
│   └── useTutor.ts
├── stores/
│   ├── authStore.ts
│   └── settingsStore.ts
├── i18n/
│   └── locales/                  ← en.json, ru.json, ky.json...
├── types/
│   └── database.ts               ← Supabase generated types
└── supabase/
    ├── migrations/               ← SQL migrations
    └── functions/                ← Edge Functions
        ├── process-pdf/
        ├── generate-summary/
        ├── generate-flashcards/
        ├── generate-exam/
        └── tutor-chat/
```

---

## UX Philosophy

Приложение ощущается как смесь **Duolingo** (геймификация, прогресс), **Notion** (чистый интерфейс), **TurboLearn** (AI-генерация контента), **ChatGPT** (AI Tutor чат).

- Тёмная тема по умолчанию, акцентный цвет — фиолетовый (`#6366f1`)
- Haptic feedback на ключевых действиях
- Анимации через `react-native-reanimated` (плавные переходы, flip-карточки)
- Skeleton loaders пока AI генерирует контент

---

## Out of Scope (MVP)

- Монетизация (Free/Pro) — следующая итерация
- Локальный on-device AI — следующая итерация
- Push-уведомления
- Социальные функции
- Экспорт flashcards в Anki
