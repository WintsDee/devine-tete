import { supabase } from "@/integrations/supabase/client";
import { WORD_BANK } from "@/lib/words";

export type Player = {
  id: string;
  room_id: string;
  name: string;
  current_word: string | null;
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
const NAME_KEY = "dt.name";
const SEEN_KEY = "dt.seenWords";

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

/** Picks a word never drawn before on this device; resets only once the whole bank is used. */
export function pickWord(): string {
  let seen = seenWords();
  let pool = WORD_BANK.filter((entry) => !seen.includes(entry.text));
  if (pool.length === 0) {
    seen = [];
    if (typeof window !== "undefined") window.localStorage.removeItem(SEEN_KEY);
    pool = [...WORD_BANK];
  }
  const word = pool[Math.floor(Math.random() * pool.length)]!.text;
  markSeen(word, seen);
  return word;
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
  try {
    const map = JSON.parse(window.localStorage.getItem(PLAYER_KEY) ?? "{}") as Record<
      string,
      string
    >;
    return map[code] ?? null;
  } catch {
    return null;
  }
}

function rememberPlayer(code: string, playerId: string) {
  let map: Record<string, string> = {};
  try {
    map = JSON.parse(window.localStorage.getItem(PLAYER_KEY) ?? "{}") as Record<string, string>;
  } catch {
    map = {};
  }
  map[code] = playerId;
  window.localStorage.setItem(PLAYER_KEY, JSON.stringify(map));
}

export async function createRoom(name: string): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = randomCode();
    const { data, error } = await supabase.from("rooms").insert({ code }).select("code").single();
    if (!error && data) {
      await joinRoom(code, name);
      return code;
    }
    if (error && !error.message.toLowerCase().includes("duplicate")) throw error;
  }
  throw new Error("Impossible de créer une partie, réessaie.");
}

export async function findRoom(code: string) {
  const { data, error } = await supabase
    .from("rooms")
    .select("id, code")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function joinRoom(code: string, name: string): Promise<Player> {
  const room = await findRoom(code);
  if (!room) throw new Error("Aucune partie avec ce code.");
  const existingId = savedPlayerId(room.code);
  if (existingId) {
    const { data } = await supabase.from("players").select("*").eq("id", existingId).maybeSingle();
    if (data) {
      if (data.name !== name) {
        await supabase.from("players").update({ name }).eq("id", data.id);
      }
      return { ...data, name } as Player;
    }
  }
  const { data, error } = await supabase
    .from("players")
    .insert({ room_id: room.id, name })
    .select("*")
    .single();
  if (error) throw error;
  rememberPlayer(room.code, data.id);
  return data as Player;
}

export async function listPlayers(roomId: string): Promise<Player[]> {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Player[];
}

export async function drawWord(playerId: string | null): Promise<string> {
  const word = pickWord();
  if (playerId) {
    await supabase.from("players").update({ current_word: word }).eq("id", playerId);
  }
  return word;
}

export async function clearWord(playerId: string | null) {
  if (!playerId) return;
  await supabase.from("players").update({ current_word: null }).eq("id", playerId);
}

/** Stores a word typed by hand on the player's phone. */
export async function setPlayerWord(playerId: string | null, word: string) {
  if (!playerId) return;
  await supabase.from("players").update({ current_word: word }).eq("id", playerId);
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
  const { error } = await supabase.from("word_suggestions").insert({
    room_id: params.roomId,
    target_player_id: params.targetPlayerId,
    author_player_id: params.authorPlayerId,
    author_name: params.authorName || "Un voisin",
    text,
  });
  if (error) throw error;
}

const SUGGESTION_TTL_MS = 10 * 60 * 1000;

/** Latest still-valid suggestion for a player (older than 10 min is ignored). */
export async function pendingSuggestion(
  playerId: string | null,
): Promise<WordSuggestion | null> {
  if (!playerId) return null;
  const since = new Date(Date.now() - SUGGESTION_TTL_MS).toISOString();
  const { data, error } = await supabase
    .from("word_suggestions")
    .select("*")
    .eq("target_player_id", playerId)
    .eq("status", "pending")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  return (data?.[0] as WordSuggestion | undefined) ?? null;
}

export async function resolveSuggestion(id: string, status: "used" | "skipped") {
  await supabase.from("word_suggestions").update({ status }).eq("id", id);
}

export async function useSuggestion(suggestion: WordSuggestion, playerId: string | null) {
  await resolveSuggestion(suggestion.id, "used");
  if (playerId) {
    await supabase.from("players").update({ current_word: suggestion.text }).eq("id", playerId);
  }
  return suggestion.text;
}
