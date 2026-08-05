// Server-only game logic. Every browser-facing action goes through here so that
// room membership is verified with the private player token before any read or
// write: the database tables themselves are unreachable from the browser.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type Auth = { playerId: string; token: string };

const PLAYER_COLUMNS = "id, room_id, name, has_word, created_at";

function fail(message: string): never {
  throw new Error(message);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function uuid(value: unknown, label: string): string {
  if (typeof value !== "string" || !UUID.test(value)) fail(`invalid ${label}`);
  return value;
}

function text(value: unknown, label: string, max: number, min = 1): string {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (trimmed.length < min || trimmed.length > max) fail(`invalid ${label}`);
  return trimmed;
}

/** Resolves the caller from its private token and returns the owned player row. */
async function requirePlayer(auth: Auth) {
  const playerId = uuid(auth?.playerId, "player");
  const token = uuid(auth?.token, "token");
  const { data } = await supabaseAdmin
    .from("players")
    .select("id, room_id, name, created_at")
    .eq("id", playerId)
    .eq("token", token)
    .maybeSingle();
  if (!data) fail("not allowed");
  return data;
}

/** Caller must be a player of the room it is trying to read or change. */
async function requireMember(auth: Auth, roomId: string) {
  const player = await requirePlayer(auth);
  if (player.room_id !== uuid(roomId, "room")) fail("not allowed");
  return player;
}

async function teamRoom(teamId: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from("teams")
    .select("room_id")
    .eq("id", uuid(teamId, "team"))
    .maybeSingle();
  if (!data) fail("unknown team");
  return data.room_id;
}

async function gameRoom(gameId: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from("chrono_games")
    .select("room_id")
    .eq("id", uuid(gameId, "game"))
    .maybeSingle();
  if (!data) fail("unknown game");
  return data.room_id;
}

/* ---------------------------------- rooms --------------------------------- */

export async function findRoomImpl(code: unknown) {
  const value = text(code, "code", 4, 4).toUpperCase();
  const { data } = await supabaseAdmin
    .from("rooms")
    .select("id, code")
    .eq("code", value)
    .maybeSingle();
  return data ?? null;
}

export async function createRoomImpl(code: unknown) {
  const value = text(code, "code", 4, 4).toUpperCase();
  const { data, error } = await supabaseAdmin
    .from("rooms")
    .insert({ code: value })
    .select("id, code")
    .single();
  if (error) fail(error.message);
  return data;
}

export async function joinRoomImpl(input: { roomId: unknown; name: unknown }) {
  const roomId = uuid(input.roomId, "room");
  const name = text(input.name, "name", 30);
  const room = await supabaseAdmin.from("rooms").select("id").eq("id", roomId).maybeSingle();
  if (!room.data) fail("unknown room");
  const { data, error } = await supabaseAdmin
    .from("players")
    .insert({ room_id: roomId, name })
    .select("id, room_id, name, token, created_at")
    .single();
  if (error) fail(error.message);
  return data;
}

export async function syncPlayerImpl(input: Auth & { name: unknown }) {
  const player = await requirePlayer(input);
  const name = text(input.name, "name", 30);
  const { data } = await supabaseAdmin
    .from("players")
    .update({ name })
    .eq("id", player.id)
    .select(PLAYER_COLUMNS)
    .maybeSingle();
  return data ?? null;
}

export async function listPlayersImpl(input: Auth & { roomId: string }) {
  await requireMember(input, input.roomId);
  const { data } = await supabaseAdmin
    .from("players")
    .select(PLAYER_COLUMNS)
    .eq("room_id", input.roomId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function setPlayerWordImpl(input: Auth & { word: unknown }) {
  const player = await requirePlayer(input);
  const raw = typeof input.word === "string" ? input.word.trim() : "";
  if (raw.length > 120) fail("invalid word");
  const word = raw.length > 0 ? raw : null;
  await supabaseAdmin
    .from("players")
    .update({ current_word: word, has_word: word !== null })
    .eq("id", player.id);
  return { ok: true };
}

/* ------------------------------- suggestions ------------------------------ */

export async function sendSuggestionImpl(
  input: Auth & { roomId: string; targetPlayerId: unknown; authorName: unknown; text: unknown },
) {
  const author = await requireMember(input, input.roomId);
  const body = text(input.text, "suggestion", 60);
  const authorName = text(input.authorName ?? "Un voisin", "author", 30);
  const targetId = uuid(input.targetPlayerId, "target");
  const target = await supabaseAdmin
    .from("players")
    .select("id")
    .eq("id", targetId)
    .eq("room_id", input.roomId)
    .maybeSingle();
  if (!target.data) fail("unknown target player");
  const { error } = await supabaseAdmin.from("word_suggestions").insert({
    room_id: input.roomId,
    target_player_id: targetId,
    author_player_id: author.id,
    author_name: authorName,
    text: body,
  });
  if (error) fail(error.message);
  return { ok: true };
}

export async function mySuggestionImpl(input: Auth) {
  const player = await requirePlayer(input);
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data } = await supabaseAdmin
    .from("word_suggestions")
    .select("id, room_id, target_player_id, author_player_id, author_name, text, status, created_at")
    .eq("target_player_id", player.id)
    .eq("status", "pending")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}

export async function resolveSuggestionImpl(input: Auth & { id: unknown; status: unknown }) {
  const player = await requirePlayer(input);
  const status = input.status === "used" || input.status === "skipped" ? input.status : fail("invalid status");
  await supabaseAdmin
    .from("word_suggestions")
    .update({ status })
    .eq("id", uuid(input.id, "suggestion"))
    .eq("target_player_id", player.id);
  return { ok: true };
}

/* ---------------------------------- teams --------------------------------- */

export async function listTeamsImpl(input: Auth & { roomId: string }) {
  await requireMember(input, input.roomId);
  const { data } = await supabaseAdmin
    .from("teams")
    .select("*")
    .eq("room_id", input.roomId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function listTeamMembersImpl(input: Auth & { roomId: string }) {
  await requireMember(input, input.roomId);
  const teams = await supabaseAdmin.from("teams").select("id").eq("room_id", input.roomId);
  const ids = (teams.data ?? []).map((team) => team.id);
  if (ids.length === 0) return [];
  const { data } = await supabaseAdmin
    .from("team_members")
    .select("id, team_id, player_id")
    .in("team_id", ids);
  return data ?? [];
}

export async function createTeamImpl(input: Auth & { roomId: string; name: unknown; color: unknown }) {
  await requireMember(input, input.roomId);
  const name = text(input.name, "team name", 30);
  const color = text(input.color, "color", 20);
  const { data, error } = await supabaseAdmin
    .from("teams")
    .insert({ room_id: input.roomId, name, color })
    .select("*")
    .single();
  if (error) fail(error.message);
  return data;
}

export async function deleteTeamImpl(input: Auth & { teamId: string }) {
  const room = await teamRoom(input.teamId);
  await requireMember(input, room);
  await supabaseAdmin.from("teams").delete().eq("id", input.teamId);
  return { ok: true };
}

/** A player may only move itself between teams of its own room. */
export async function joinTeamImpl(input: Auth & { teamId: string }) {
  const room = await teamRoom(input.teamId);
  const player = await requireMember(input, room);
  const teams = await supabaseAdmin.from("teams").select("id").eq("room_id", room);
  const ids = (teams.data ?? []).map((team) => team.id);
  if (ids.length > 0) {
    await supabaseAdmin.from("team_members").delete().eq("player_id", player.id).in("team_id", ids);
  }
  const { error } = await supabaseAdmin
    .from("team_members")
    .insert({ team_id: input.teamId, player_id: player.id });
  if (error) fail(error.message);
  return { ok: true };
}

/* --------------------------------- chrono --------------------------------- */

export async function activeGameImpl(input: Auth & { roomId: string }) {
  await requireMember(input, input.roomId);
  const { data } = await supabaseAdmin
    .from("chrono_games")
    .select("*")
    .eq("room_id", input.roomId)
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}

export async function createGameImpl(
  input: Auth & { roomId: string; rounds: unknown; firstTeamId: string; durationSeconds: unknown },
) {
  await requireMember(input, input.roomId);
  const rounds = Number(input.rounds);
  const duration = Number(input.durationSeconds);
  if (!Number.isInteger(rounds) || rounds < 1 || rounds > 10) fail("invalid rounds");
  if (!Number.isInteger(duration) || duration < 30 || duration > 900) fail("invalid duration");
  const firstTeamRoom = await teamRoom(input.firstTeamId);
  if (firstTeamRoom !== input.roomId) fail("not allowed");
  await supabaseAdmin.from("chrono_games").update({ status: "archived" }).eq("room_id", input.roomId);
  const { data, error } = await supabaseAdmin
    .from("chrono_games")
    .insert({
      room_id: input.roomId,
      rounds,
      current_round: 1,
      current_team_id: input.firstTeamId,
      status: "waiting",
      duration_seconds: duration,
    })
    .select("*")
    .single();
  if (error) fail(error.message);
  return data;
}

export async function archiveGameImpl(input: Auth & { gameId: string }) {
  const room = await gameRoom(input.gameId);
  await requireMember(input, room);
  await supabaseAdmin.from("chrono_games").update({ status: "archived" }).eq("id", input.gameId);
  return { ok: true };
}

export async function startTurnImpl(input: Auth & { gameId: string }) {
  const room = await gameRoom(input.gameId);
  await requireMember(input, room);
  const { data: game } = await supabaseAdmin
    .from("chrono_games")
    .select("duration_seconds")
    .eq("id", input.gameId)
    .maybeSingle();
  if (!game) fail("unknown game");
  const endsAt = new Date(Date.now() + game.duration_seconds * 1000).toISOString();
  await supabaseAdmin
    .from("chrono_games")
    .update({ status: "playing", turn_ends_at: endsAt })
    .eq("id", input.gameId);
  return { ok: true };
}

export async function listScoresImpl(input: Auth & { gameId: string }) {
  const room = await gameRoom(input.gameId);
  await requireMember(input, room);
  const { data } = await supabaseAdmin
    .from("chrono_scores")
    .select("*")
    .eq("game_id", input.gameId)
    .order("round", { ascending: true });
  return data ?? [];
}

/** Stores the finished turn, then hands over to the next team, round or the final screen. */
export async function submitTurnImpl(
  input: Auth & {
    gameId: string;
    points: unknown;
    found: unknown;
    skipped: unknown;
  },
) {
  const room = await gameRoom(input.gameId);
  const player = await requireMember(input, room);
  const points = Number(input.points);
  if (!Number.isInteger(points) || points < 0 || points > 1000) fail("invalid points");

  const { data: game } = await supabaseAdmin
    .from("chrono_games")
    .select("*")
    .eq("id", input.gameId)
    .maybeSingle();
  if (!game) fail("unknown game");

  const { data: teamRows } = await supabaseAdmin
    .from("teams")
    .select("id")
    .eq("room_id", room)
    .order("created_at", { ascending: true });
  const teams = teamRows ?? [];

  // Only a member of the team currently on turn can report that turn.
  const { data: membership } = await supabaseAdmin
    .from("team_members")
    .select("team_id")
    .eq("player_id", player.id);
  const myTeams = (membership ?? []).map((row) => row.team_id);
  if (!game.current_team_id || !myTeams.includes(game.current_team_id)) fail("not allowed");

  await supabaseAdmin.from("chrono_scores").upsert(
    {
      game_id: game.id,
      team_id: game.current_team_id,
      round: game.current_round,
      points,
      found_words: (input.found ?? []) as never,
      skipped_words: (input.skipped ?? []) as never,
    },
    { onConflict: "game_id,team_id,round" },
  );

  const index = teams.findIndex((team) => team.id === game.current_team_id);
  const next = teams[index + 1];
  if (next) {
    await supabaseAdmin
      .from("chrono_games")
      .update({ current_team_id: next.id, status: "waiting", turn_ends_at: null })
      .eq("id", game.id);
    return { ok: true };
  }
  if (game.current_round < game.rounds && teams[0]) {
    await supabaseAdmin
      .from("chrono_games")
      .update({
        current_round: game.current_round + 1,
        current_team_id: teams[0].id,
        status: "waiting",
        turn_ends_at: null,
      })
      .eq("id", game.id);
    return { ok: true };
  }
  await supabaseAdmin
    .from("chrono_games")
    .update({ status: "finished", turn_ends_at: null })
    .eq("id", game.id);
  return { ok: true };
}
