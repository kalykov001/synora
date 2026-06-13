export type DocumentStatus = 'uploading' | 'processing' | 'ready' | 'error'
export type MessageRole = 'user' | 'assistant'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  language: string
  created_at: string
}

export interface Document {
  id: string
  user_id: string
  title: string
  file_path: string
  extracted_text: string | null
  language_detected: string | null
  page_count: number | null
  status: DocumentStatus
  created_at: string
}

export interface Summary {
  id: string
  document_id: string
  content: string
  language: string
  created_at: string
}

export interface FlashcardSet {
  id: string
  document_id: string
  title: string
  created_at: string
}

export interface FlashcardItem {
  id: string
  set_id: string
  question: string
  answer: string
  difficulty: number
}

export interface Exam {
  id: string
  document_id: string
  title: string
  created_at: string
}

export interface ExamQuestion {
  id: string
  exam_id: string
  question: string
  options: string[]
  correct: number
}

export interface ExamAttempt {
  id: string
  exam_id: string
  user_id: string
  score: number
  answers: number[]
  completed_at: string
}

export interface TutorSession {
  id: string
  user_id: string
  document_id: string | null
  created_at: string
}

export interface TutorMessage {
  id: string
  session_id: string
  role: MessageRole
  content: string
  created_at: string
}
