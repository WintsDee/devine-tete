-- 1. Player secret token + non-sensitive "has word" flag
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS token uuid NOT NULL DEFAULT gen_random_uuid();

ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS has_word boolean
  GENERATED ALWAYS AS (current_word IS NOT NULL) STORED;

-- 2. Lock down direct table access
DROP POLICY IF EXISTS "Anyone can join a room" ON public.players;
DROP POLICY IF EXISTS "Anyone can remove players" ON public.players;
DROP POLICY IF EXISTS "Anyone can update players" ON public.players;
DROP POLICY IF EXISTS "Players are readable by everyone" ON public.players;

DROP POLICY IF EXISTS "Anyone can create a room" ON public.rooms;
DROP POLICY IF EXISTS "Rooms are readable by everyone" ON public.rooms;

DROP POLICY IF EXISTS "Anyone can delete suggestions" ON public.word_suggestions;
DROP POLICY IF EXISTS "Anyone can send a suggestion" ON public.word_suggestions;
DROP POLICY IF EXISTS "Anyone can update suggestions" ON public.word_suggestions;
DROP POLICY IF EXISTS "Suggestions are readable by everyone" ON public.word_suggestions;

REVOKE ALL ON public.players FROM anon, authenticated;
REVOKE ALL ON public.rooms FROM anon, authenticated;
REVOKE ALL ON public.word_suggestions FROM anon, authenticated;

GRANT ALL ON public.players TO service_role;
GRANT ALL ON public.rooms TO service_role;
GRANT ALL ON public.word_suggestions TO service_role;

-- Public roster: names only, never the secret word nor the token
GRANT SELECT (id, room_id, name, has_word, created_at) ON public.players TO anon, authenticated;
CREATE POLICY "Player roster is readable"
  ON public.players FOR SELECT TO anon, authenticated USING (true);

-- 3. Controlled server-side operations
CREATE OR REPLACE FUNCTION public.create_room(p_code text)
RETURNS TABLE (id uuid, code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_code IS NULL OR char_length(btrim(p_code)) <> 4 THEN
    RAISE EXCEPTION 'invalid room code';
  END IF;
  INSERT INTO public.rooms (code) VALUES (upper(btrim(p_code)))
  RETURNING rooms.id, rooms.code INTO id, code;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.find_room(p_code text)
RETURNS TABLE (id uuid, code text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.code
  FROM public.rooms r
  WHERE r.code = upper(btrim(coalesce(p_code, '')))
    AND char_length(btrim(coalesce(p_code, ''))) = 4
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.join_room(p_room_id uuid, p_name text)
RETURNS TABLE (id uuid, room_id uuid, name text, token uuid, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text := btrim(coalesce(p_name, ''));
BEGIN
  IF char_length(v_name) < 1 OR char_length(v_name) > 30 THEN
    RAISE EXCEPTION 'invalid player name';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.rooms r WHERE r.id = p_room_id) THEN
    RAISE EXCEPTION 'unknown room';
  END IF;
  INSERT INTO public.players (room_id, name) VALUES (p_room_id, v_name)
  RETURNING players.id, players.room_id, players.name, players.token, players.created_at
  INTO id, room_id, name, token, created_at;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_player(p_player_id uuid, p_token uuid, p_name text)
RETURNS TABLE (id uuid, room_id uuid, name text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text := btrim(coalesce(p_name, ''));
BEGIN
  IF char_length(v_name) < 1 OR char_length(v_name) > 30 THEN
    RAISE EXCEPTION 'invalid player name';
  END IF;
  UPDATE public.players p
     SET name = v_name
   WHERE p.id = p_player_id AND p.token = p_token
  RETURNING p.id, p.room_id, p.name, p.created_at
  INTO id, room_id, name, created_at;
  IF id IS NULL THEN
    RETURN;
  END IF;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_player_word(p_player_id uuid, p_token uuid, p_word text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_word text := nullif(btrim(coalesce(p_word, '')), '');
BEGIN
  IF v_word IS NOT NULL AND char_length(v_word) > 120 THEN
    RAISE EXCEPTION 'invalid word';
  END IF;
  UPDATE public.players p
     SET current_word = v_word
   WHERE p.id = p_player_id AND p.token = p_token;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.send_suggestion(
  p_room_id uuid,
  p_target_player_id uuid,
  p_author_player_id uuid,
  p_author_token uuid,
  p_author_name text,
  p_text text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_text text := btrim(coalesce(p_text, ''));
  v_author text := nullif(btrim(coalesce(p_author_name, '')), '');
BEGIN
  IF char_length(v_text) < 1 OR char_length(v_text) > 60 THEN
    RAISE EXCEPTION 'invalid suggestion';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.players p
    WHERE p.id = p_author_player_id AND p.token = p_author_token AND p.room_id = p_room_id
  ) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.players p
    WHERE p.id = p_target_player_id AND p.room_id = p_room_id
  ) THEN
    RAISE EXCEPTION 'unknown target player';
  END IF;
  INSERT INTO public.word_suggestions (room_id, target_player_id, author_player_id, author_name, text)
  VALUES (p_room_id, p_target_player_id, p_author_player_id, coalesce(v_author, 'Un voisin'), v_text);
END;
$$;

CREATE OR REPLACE FUNCTION public.my_suggestion(p_player_id uuid, p_token uuid)
RETURNS TABLE (
  id uuid,
  room_id uuid,
  target_player_id uuid,
  author_player_id uuid,
  author_name text,
  text text,
  status text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.room_id, s.target_player_id, s.author_player_id, s.author_name, s.text, s.status, s.created_at
  FROM public.word_suggestions s
  JOIN public.players p ON p.id = s.target_player_id
  WHERE p.id = p_player_id
    AND p.token = p_token
    AND s.status = 'pending'
    AND s.created_at >= now() - interval '10 minutes'
  ORDER BY s.created_at DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.resolve_suggestion(
  p_suggestion_id uuid,
  p_player_id uuid,
  p_token uuid,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_status NOT IN ('used', 'skipped') THEN
    RAISE EXCEPTION 'invalid status';
  END IF;
  UPDATE public.word_suggestions s
     SET status = p_status
   WHERE s.id = p_suggestion_id
     AND s.target_player_id = p_player_id
     AND EXISTS (
       SELECT 1 FROM public.players p
       WHERE p.id = p_player_id AND p.token = p_token
     );
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.create_room(text) FROM public;
REVOKE ALL ON FUNCTION public.find_room(text) FROM public;
REVOKE ALL ON FUNCTION public.join_room(uuid, text) FROM public;
REVOKE ALL ON FUNCTION public.sync_player(uuid, uuid, text) FROM public;
REVOKE ALL ON FUNCTION public.set_player_word(uuid, uuid, text) FROM public;
REVOKE ALL ON FUNCTION public.send_suggestion(uuid, uuid, uuid, uuid, text, text) FROM public;
REVOKE ALL ON FUNCTION public.my_suggestion(uuid, uuid) FROM public;
REVOKE ALL ON FUNCTION public.resolve_suggestion(uuid, uuid, uuid, text) FROM public;

GRANT EXECUTE ON FUNCTION public.create_room(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_room(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.join_room(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_player(uuid, uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_player_word(uuid, uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.send_suggestion(uuid, uuid, uuid, uuid, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.my_suggestion(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_suggestion(uuid, uuid, uuid, text) TO anon, authenticated;