CREATE TABLE public.words (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.words TO anon, authenticated;
GRANT ALL ON public.words TO service_role;
ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Words are readable by everyone" ON public.words FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.rooms TO anon, authenticated;
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rooms are readable by everyone" ON public.rooms FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create a room" ON public.rooms FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  current_word TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX players_room_id_idx ON public.players(room_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.players TO anon, authenticated;
GRANT ALL ON public.players TO service_role;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players are readable by everyone" ON public.players FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can join a room" ON public.players FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update players" ON public.players FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can remove players" ON public.players FOR DELETE TO anon, authenticated USING (true);

ALTER TABLE public.players REPLICA IDENTITY FULL;
ALTER TABLE public.rooms REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;

INSERT INTO public.words (text, category) VALUES
('Albert Einstein','Personnage Réel'),
('Marie Curie','Personnage Réel'),
('Cléopâtre','Personnage Réel'),
('Léonard de Vinci','Personnage Réel'),
('Barack Obama','Personnage Réel'),
('Kylian Mbappé','Personnage Réel'),
('Napoléon Bonaparte','Personnage Réel'),
('Frida Kahlo','Personnage Réel'),
('Vincent van Gogh','Personnage Réel'),
('Freddie Mercury','Personnage Réel'),
('Amelia Earhart','Personnage Réel'),
('Nikola Tesla','Personnage Réel'),
('Jeanne d''Arc','Personnage Réel'),
('Serena Williams','Personnage Réel'),
('Zinédine Zidane','Personnage Réel'),
('Coco Chanel','Personnage Réel'),
('Salvador Dalí','Personnage Réel'),
('Michael Jackson','Personnage Réel'),
('Simone Veil','Personnage Réel'),
('Charles de Gaulle','Personnage Réel'),
('Steve Jobs','Personnage Réel'),
('Greta Thunberg','Personnage Réel'),
('Édith Piaf','Personnage Réel'),
('Usain Bolt','Personnage Réel'),
('Jacques Cousteau','Personnage Réel'),
('Rosa Parks','Personnage Réel'),
('Mozart','Personnage Réel'),
('Louis Pasteur','Personnage Réel'),
('Beyoncé','Personnage Réel'),
('Alfred Hitchcock','Personnage Réel'),
('Sherlock Holmes','Personnage Fictif'),
('Darth Vader','Personnage Fictif'),
('Gandalf','Personnage Fictif'),
('Ollivander','Personnage Fictif'),
('Hermione Granger','Personnage Fictif'),
('Dark Sidious','Personnage Fictif'),
('Frodon Sacquet','Personnage Fictif'),
('Bilbo Sacquet','Personnage Fictif'),
('Severus Rogue','Personnage Fictif'),
('Dobby','Personnage Fictif'),
('Jack Sparrow','Personnage Fictif'),
('Hannibal Lecter','Personnage Fictif'),
('Walter White','Personnage Fictif'),
('Tony Soprano','Personnage Fictif'),
('Daenerys Targaryen','Personnage Fictif'),
('Tyrion Lannister','Personnage Fictif'),
('Astérix','Personnage Fictif'),
('Obélix','Personnage Fictif'),
('Le Capitaine Haddock','Personnage Fictif'),
('Tintin'',','Personnage Fictif'),
('Gollum','Personnage Fictif'),
('Forrest Gump','Personnage Fictif'),
('Indiana Jones','Personnage Fictif'),
('Mary Poppins','Personnage Fictif'),
('Cruella d''Enfer','Personnage Fictif'),
('Bugs Bunny','Personnage Fictif'),
('Homer Simpson','Personnage Fictif'),
('Eleven (Stranger Things)','Personnage Fictif'),
('Amélie Poulain','Personnage Fictif'),
('Le Petit Prince','Personnage Fictif'),
('La Joconde','Mot Difficile'),
('Le syndrome de Stockholm','Mot Difficile'),
('La théorie de la relativité','Mot Difficile'),
('Un trou noir','Mot Difficile'),
('La photosynthèse','Mot Difficile'),
('Le Mur de Berlin','Mot Difficile'),
('Un mirage','Mot Difficile'),
('La procrastination','Mot Difficile'),
('Un accordéon','Mot Difficile'),
('Le mille-feuille','Mot Difficile'),
('Un boomerang','Mot Difficile'),
('La Tour de Pise','Mot Difficile');