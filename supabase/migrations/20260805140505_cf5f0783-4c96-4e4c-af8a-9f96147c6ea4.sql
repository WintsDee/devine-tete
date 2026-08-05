-- Drop all public policies on game tables
DROP POLICY IF EXISTS "Player roster is readable" ON public.players;

DROP POLICY IF EXISTS "Teams readable by everyone" ON public.teams;
DROP POLICY IF EXISTS "Anyone can create a team" ON public.teams;
DROP POLICY IF EXISTS "Anyone can update teams" ON public.teams;
DROP POLICY IF EXISTS "Anyone can delete teams" ON public.teams;

DROP POLICY IF EXISTS "Team members readable by everyone" ON public.team_members;
DROP POLICY IF EXISTS "Anyone can join a team" ON public.team_members;
DROP POLICY IF EXISTS "Anyone can update team members" ON public.team_members;
DROP POLICY IF EXISTS "Anyone can leave a team" ON public.team_members;

DROP POLICY IF EXISTS "Chrono games readable by everyone" ON public.chrono_games;
DROP POLICY IF EXISTS "Anyone can create a chrono game" ON public.chrono_games;
DROP POLICY IF EXISTS "Anyone can update chrono games" ON public.chrono_games;
DROP POLICY IF EXISTS "Anyone can delete chrono games" ON public.chrono_games;

DROP POLICY IF EXISTS "Chrono scores readable by everyone" ON public.chrono_scores;
DROP POLICY IF EXISTS "Anyone can create chrono scores" ON public.chrono_scores;
DROP POLICY IF EXISTS "Anyone can update chrono scores" ON public.chrono_scores;
DROP POLICY IF EXISTS "Anyone can delete chrono scores" ON public.chrono_scores;

-- Revoke every direct Data API privilege from browser roles
REVOKE ALL ON public.players FROM anon, authenticated;
REVOKE ALL ON public.rooms FROM anon, authenticated;
REVOKE ALL ON public.teams FROM anon, authenticated;
REVOKE ALL ON public.team_members FROM anon, authenticated;
REVOKE ALL ON public.chrono_games FROM anon, authenticated;
REVOKE ALL ON public.chrono_scores FROM anon, authenticated;
REVOKE ALL ON public.word_suggestions FROM anon, authenticated;

GRANT ALL ON public.players TO service_role;
GRANT ALL ON public.rooms TO service_role;
GRANT ALL ON public.teams TO service_role;
GRANT ALL ON public.team_members TO service_role;
GRANT ALL ON public.chrono_games TO service_role;
GRANT ALL ON public.chrono_scores TO service_role;
GRANT ALL ON public.word_suggestions TO service_role;

-- Remove SECURITY DEFINER functions that were callable by anon/authenticated
DROP FUNCTION IF EXISTS public.create_room(text);
DROP FUNCTION IF EXISTS public.find_room(text);
DROP FUNCTION IF EXISTS public.join_room(uuid, text);
DROP FUNCTION IF EXISTS public.sync_player(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.set_player_word(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.send_suggestion(uuid, uuid, uuid, uuid, text, text);
DROP FUNCTION IF EXISTS public.my_suggestion(uuid, uuid);
DROP FUNCTION IF EXISTS public.resolve_suggestion(uuid, uuid, uuid, text);

-- Trigger helper must not be callable from the API
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;