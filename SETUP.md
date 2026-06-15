# Synora — Setup Guide

## 1. Install dependencies

```bash
npm install --legacy-peer-deps
```

## 2. Supabase project

1. Create a project at https://supabase.com
2. Go to **Settings → API** and copy:
   - Project URL → `EXPO_PUBLIC_SUPABASE_URL`
   - anon/public key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → needed for Edge Functions secrets

3. Fill in `.env.local`:
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## 3. Apply database schema

In Supabase dashboard → **SQL Editor**, paste and run the contents of:
```
supabase/migrations/001_initial_schema.sql
```

## 4. Deploy Edge Functions

Install Supabase CLI: https://supabase.com/docs/guides/cli

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Set secrets
supabase secrets set GEMINI_API_KEY=your_gemini_api_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Deploy all functions
supabase functions deploy process-pdf
supabase functions deploy generate-summary
supabase functions deploy generate-flashcards
supabase functions deploy generate-exam
supabase functions deploy tutor-chat
```

Get a Gemini API key at: https://aistudio.google.com/app/apikey

## 5. Run the app

```bash
npx expo start
```

Press `a` for Android emulator, `i` for iOS simulator, or scan QR with Expo Go.

## Architecture

```
User uploads PDF
  → Supabase Storage (pdfs bucket)
  → Document record (status: uploading)
  → process-pdf Edge Function
      → Gemini 1.5 Flash (inline_data base64 PDF)
      → Extracts text + language + page count
      → Document status: ready

User taps "Создать конспект"
  → generate-summary Edge Function
      → Gemini 1.5 Flash → markdown summary
      → Saved to summaries table

User taps "Создать карточки"
  → generate-flashcards Edge Function
      → Gemini 1.5 Flash → Q&A pairs JSON
      → Saved to flashcard_sets + flashcard_items

User taps "Создать экзамен"
  → generate-exam Edge Function
      → Gemini 1.5 Flash → MCQ questions JSON
      → Saved to exams + exam_questions

AI Tutor chat
  → tutor-chat Edge Function
      → Gemini 1.5 Pro with doc context + message history
      → Saves user + assistant messages to tutor_messages
```
