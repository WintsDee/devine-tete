CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT 'yellow',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO anon, authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teams readable by everyone" ON public.teams FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create a team" ON public.teams FOR INSERT TO anon, authenticated WITH CHECK (char_length(btrim(name)) BETWEEN 1 AND 30);
CREATE POLICY "Anyone can update teams" ON public.teams FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete teams" ON public.teams FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, player_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO anon, authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members readable by everyone" ON public.team_members FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can join a team" ON public.team_members FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update team members" ON public.team_members FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can leave a team" ON public.team_members FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE public.chrono_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  rounds integer NOT NULL DEFAULT 1,
  current_round integer NOT NULL DEFAULT 1,
  current_team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'waiting',
  turn_ends_at timestamptz,
  duration_seconds integer NOT NULL DEFAULT 180,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chrono_games TO anon, authenticated;
GRANT ALL ON public.chrono_games TO service_role;
ALTER TABLE public.chrono_games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chrono games readable by everyone" ON public.chrono_games FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create a chrono game" ON public.chrono_games FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update chrono games" ON public.chrono_games FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete chrono games" ON public.chrono_games FOR DELETE TO anon, authenticated USING (true);
CREATE TRIGGER update_chrono_games_updated_at BEFORE UPDATE ON public.chrono_games FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.chrono_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.chrono_games(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  round integer NOT NULL DEFAULT 1,
  points integer NOT NULL DEFAULT 0,
  found_words jsonb NOT NULL DEFAULT '[]'::jsonb,
  skipped_words jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (game_id, team_id, round)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chrono_scores TO anon, authenticated;
GRANT ALL ON public.chrono_scores TO service_role;
ALTER TABLE public.chrono_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chrono scores readable by everyone" ON public.chrono_scores FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create chrono scores" ON public.chrono_scores FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update chrono scores" ON public.chrono_scores FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete chrono scores" ON public.chrono_scores FOR DELETE TO anon, authenticated USING (true);
CREATE TRIGGER update_chrono_scores_updated_at BEFORE UPDATE ON public.chrono_scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chrono_games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chrono_scores;