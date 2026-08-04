CREATE TABLE public.word_suggestions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  target_player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  author_player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  text text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.word_suggestions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.word_suggestions TO authenticated;
GRANT ALL ON public.word_suggestions TO service_role;

ALTER TABLE public.word_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suggestions are readable by everyone" ON public.word_suggestions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can send a suggestion" ON public.word_suggestions FOR INSERT TO anon, authenticated WITH CHECK (char_length(btrim(text)) BETWEEN 1 AND 60);
CREATE POLICY "Anyone can update suggestions" ON public.word_suggestions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete suggestions" ON public.word_suggestions FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX word_suggestions_target_idx ON public.word_suggestions (target_player_id, status, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_word_suggestions_updated_at BEFORE UPDATE ON public.word_suggestions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.word_suggestions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.word_suggestions;