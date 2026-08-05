import { supabase } from "@/integrations/supabase/client";
import { WORD_BANK } from "@/lib/words";
import type { BankWord } from "@/lib/words-types";

export type Player = {
  id: string;
  room_id: string;
  name: string;
  has_word: boolean;
  created_at: string;
};

export type WordSuggestion = {
  id: string;
  room_id: string;
  target_player_id: string;
  author_player_id: string | null;
  author_name: string;
  text: string;
  status: string;
  created_at: string;
};

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const PLAYER_KEY = "dt.player";
const TOKEN_KEY = "dt.playerToken";
const NAME_KEY = "dt.name";
const SEEN_KEY = "dt.seenWords";

const PLAYER_COLUMNS = "id, room_id, name, has_word, created_at";

function readMap(key: string): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

/** Private per-player token proving ownership of a player row server-side. */
export function savedPlayerToken(playerId: string | null): string | null {
  if (!playerId) return null;
  return readMap(TOKEN_KEY)[playerId] ?? null;
}

function rememberToken(playerId: string, token: string) {
  const map = readMap(TOKEN_KEY);
  map[playerId] = token;
  window.localStorage.setItem(TOKEN_KEY, JSON.stringify(map));
}

function seenWords(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function markSeen(word: string, seen: string[]) {
  if (typeof window === "undefined") return;
  const next = [...seen, word];
  window.localStorage.setItem(SEEN_KEY, JSON.stringify(next));
}

/** Picks an entry never drawn before on this device; resets only once the whole bank is used. */
export function pickWord(): BankWord {
  let seen = seenWords();
  let pool = WORD_BANK.filter((entry) => !seen.includes(entry.text));
  if (pool.length === 0) {
    seen = [];
    if (typeof window !== "undefined") window.localStorage.removeItem(SEEN_KEY);
    pool = [...WORD_BANK];
  }
  const entry = pool[Math.floor(Math.random() * pool.length)]!;
  markSeen(entry.text, seen);
  return entry;
}

function randomCode() {
  return Array.from(
    { length: 4 },
    () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)],
  ).join("");
}

export function savedName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(NAME_KEY) ?? "";
}

export function rememberName(name: string) {
  window.localStorage.setItem(NAME_KEY, name);
}

export function savedPlayerId(code: string): string | null {
  if (typeof window === "undefined") return null;
  return readMap(PLAYER_KEY)[code] ?? null;
}

function rememberPlayer(code: string, playerId: string) {
  const map = readMap(PLAYER_KEY);
  map[code] = playerId;
  window.localStorage.setItem(PLAYER_KEY, JSON.stringify(map));
}

export async function createRoom(name: string): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = randomCode();
    const { data, error } = await supabase.rpc("create_room", { p_code: code });
    const room = data?.[0];
    if (!error && room) {
      await joinRoom(code, name);
      return code;
    }
    if (error && !error.message.toLowerCase().includes("duplicate")) throw error;
  }
  throw new Error("Impossible de créer une partie, réessaie.");
}

export async function findRoom(code: string) {
  const { data, error } = await supabase.rpc("find_room", { p_code: code.toUpperCase() });
  if (error) throw error;
  return data?.[0] ?? null;
}

export async function joinRoom(code: string, name: string): Promise<Player> {
  const room = await findRoom(code);
  if (!room) throw new Error("Aucune partie avec ce code.");
  const existingId = savedPlayerId(room.code);
  const existingToken = savedPlayerToken(existingId);
  if (existingId && existingToken) {
    const { data } = await supabase.rpc("sync_player", {
      p_player_id: existingId,
      p_token: existingToken,
      p_name: name,
    });
    const synced = data?.[0];
    if (synced) {
      const { data: fresh } = await supabase
        .from("players")
        .select(PLAYER_COLUMNS)
        .eq("id", synced.id)
        .maybeSingle();
      return (fresh ?? { ...synced, has_word: false }) as Player;
    }
  }
  const { data, error } = await supabase.rpc("join_room", { p_room_id: room.id, p_name: name });
  const created = data?.[0];
  if (error) throw error;
  if (!created) throw new Error("Impossible de rejoindre la partie.");
  rememberPlayer(room.code, created.id);
  rememberToken(created.id, created.token);
  return {
    id: created.id,
    room_id: created.room_id,
    name: created.name,
    has_word: false,
    created_at: created.created_at,
  };
}

export async function listPlayers(roomId: string): Promise<Player[]> {
  const { data, error } = await supabase
    .from("players")
    .select(PLAYER_COLUMNS)
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Player[];
}

async function writeWord(playerId: string | null, word: string | null) {
  const token = savedPlayerToken(playerId);
  if (!playerId || !token) return;
  const { error } = await supabase.rpc("set_player_word", {
    p_player_id: playerId,
    p_token: token,
    p_word: word ?? "",
  });
  if (error) throw error;
}

export async function drawWord(playerId: string | null): Promise<BankWord> {
  const entry = pickWord();
  await writeWord(playerId, entry.text);
  return entry;
}

export async function clearWord(playerId: string | null) {
  await writeWord(playerId, null);
}

/** Stores a word typed by hand on the player's phone. */
export async function setPlayerWord(playerId: string | null, word: string) {
  await writeWord(playerId, word);
}

export async function sendSuggestion(params: {
  roomId: string;
  targetPlayerId: string;
  authorPlayerId: string | null;
  authorName: string;
  text: string;
}) {
  const text = params.text.trim();
  if (text.length < 1 || text.length > 60) {
    throw new Error("Le mot doit faire entre 1 et 60 caractères.");
  }
  const token = savedPlayerToken(params.authorPlayerId);
  if (!params.authorPlayerId || !token) {
    throw new Error("Rejoins la partie avant de souffler un mot.");
  }
  const { error } = await supabase.rpc("send_suggestion", {
    p_room_id: params.roomId,
    p_target_player_id: params.targetPlayerId,
    p_author_player_id: params.authorPlayerId,
    p_author_token: token,
    p_author_name: params.authorName || "Un voisin",
    p_text: text,
  });
  if (error) throw error;
}

/** Latest still-valid suggestion for a player (older than 10 min is ignored). */
export async function pendingSuggestion(
  playerId: string | null,
): Promise<WordSuggestion | null> {
  const token = savedPlayerToken(playerId);
  if (!playerId || !token) return null;
  const { data, error } = await supabase.rpc("my_suggestion", {
    p_player_id: playerId,
    p_token: token,
  });
  if (error) throw error;
  return (data?.[0] as WordSuggestion | undefined) ?? null;
}

export async function resolveSuggestion(
  id: string,
  playerId: string | null,
  status: "used" | "skipped",
) {
  const token = savedPlayerToken(playerId);
  if (!playerId || !token) return;
  const { error } = await supabase.rpc("resolve_suggestion", {
    p_suggestion_id: id,
    p_player_id: playerId,
    p_token: token,
    p_status: status,
  });
  if (error) throw error;
}

export async function useSuggestion(suggestion: WordSuggestion, playerId: string | null) {
  await resolveSuggestion(suggestion.id, playerId, "used");
  await writeWord(playerId, suggestion.text);
  return suggestion.text;
}
