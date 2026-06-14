-- Synora Initial Schema

CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT,
  avatar_url TEXT,
  language   TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TABLE documents (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title             TEXT        NOT NULL,
  file_path         TEXT        NOT NULL,
  extracted_text    TEXT,
  language_detected TEXT,
  page_count        INT,
  status            TEXT        NOT NULL DEFAULT 'uploading'
                                CHECK (status IN ('uploading','processing','ready','error')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE summaries (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID        NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL,
  language    TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE flashcard_sets (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID        NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE flashcard_items (
  id         UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id     UUID  NOT NULL REFERENCES flashcard_sets(id) ON DELETE CASCADE,
  question   TEXT  NOT NULL,
  answer     TEXT  NOT NULL,
  difficulty INT   NOT NULL DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5)
);

CREATE TABLE exams (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID        NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE exam_questions (
  id       UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id  UUID  NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question TEXT  NOT NULL,
  options  JSONB NOT NULL,
  correct  INT   NOT NULL
);

CREATE TABLE exam_attempts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id      UUID        NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score        INT         NOT NULL,
  answers      JSONB       NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tutor_sessions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_id UUID        REFERENCES documents(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tutor_messages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID        NOT NULL REFERENCES tutor_sessions(id) ON DELETE CASCADE,
  role       TEXT        NOT NULL CHECK (role IN ('user','assistant')),
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents       ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries       ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_sets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams            ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_messages   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own profile"         ON profiles        FOR ALL USING (auth.uid() = id);
CREATE POLICY "own documents"       ON documents       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own summaries"       ON summaries       FOR ALL USING (
  EXISTS (SELECT 1 FROM documents d WHERE d.id = summaries.document_id AND d.user_id = auth.uid())
);
CREATE POLICY "own flashcard_sets"  ON flashcard_sets  FOR ALL USING (
  EXISTS (SELECT 1 FROM documents d WHERE d.id = flashcard_sets.document_id AND d.user_id = auth.uid())
);
CREATE POLICY "own flashcard_items" ON flashcard_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM flashcard_sets fs
    JOIN documents d ON d.id = fs.document_id
    WHERE fs.id = flashcard_items.set_id AND d.user_id = auth.uid()
  )
);
CREATE POLICY "own exams"           ON exams           FOR ALL USING (
  EXISTS (SELECT 1 FROM documents d WHERE d.id = exams.document_id AND d.user_id = auth.uid())
);
CREATE POLICY "own exam_questions"  ON exam_questions  FOR ALL USING (
  EXISTS (
    SELECT 1 FROM exams e
    JOIN documents d ON d.id = e.document_id
    WHERE e.id = exam_questions.exam_id AND d.user_id = auth.uid()
  )
);
CREATE POLICY "own exam_attempts"   ON exam_attempts   FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own tutor_sessions"  ON tutor_sessions  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own tutor_messages"  ON tutor_messages  FOR ALL USING (
  EXISTS (SELECT 1 FROM tutor_sessions ts WHERE ts.id = tutor_messages.session_id AND ts.user_id = auth.uid())
);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('pdfs', 'pdfs', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

CREATE POLICY "own pdfs" ON storage.objects FOR ALL
  USING (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "public avatars read" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
CREATE POLICY "own avatars write" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
