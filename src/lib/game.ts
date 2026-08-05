import {
  createRoomFn,
  findRoomFn,
  joinRoomFn,
  listPlayersFn,
  mySuggestionFn,
  resolveSuggestionFn,
  sendSuggestionFn,
  setPlayerWordFn,
  syncPlayerFn,
} from "@/lib/api.functions";
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

export type Auth = { playerId: string; token: string };

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const PLAYER_KEY = "dt.player";
const ROOM_KEY = "dt.playerByRoom";
const TOKEN_KEY = "dt.playerToken";
const NAME_KEY = "dt.name";
const SEEN_KEY = "dt.seenWords";

function readMap(key: string): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function writeMap(key: string, id: string, value: string) {
  if (typeof window === "undefined") return;
  const map = readMap(key);
  map[id] = value;
  window.localStorage.setItem(key, JSON.stringify(map));
}

/** Private per-player token proving ownership of a player row server-side. */
export function savedPlayerToken(playerId: string | null): string | null {
  if (!playerId) return null;
  return readMap(TOKEN_KEY)[playerId] ?? null;
}

/** Credentials the server needs to prove the caller belongs to this room. */
export function authForRoom(roomId: string): Auth | null {
  const playerId = readMap(ROOM_KEY)[roomId] ?? null;
  const token = savedPlayerToken(playerId);
  return playerId && token ? { playerId, token } : null;
}

function requireAuthForRoom(roomId: string): Auth {
  const auth = authForRoom(roomId);
  if (!auth) throw new Error("Rejoins la partie avec ton pseudo.");
  return auth;
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

/** Most draws must be easy words: 70% level 1, 22% level 2, 8% level 3. */
const LEVEL_WEIGHTS: Array<{ level: 1 | 2 | 3; weight: number }> = [
  { level: 1, weight: 0.7 },
  { level: 2, weight: 0.22 },
  { level: 3, weight: 0.08 },
];

function targetLevel(): 1 | 2 | 3 {
  const roll = Math.random();
  let sum = 0;
  for (const entry of LEVEL_WEIGHTS) {
    sum += entry.weight;
    if (roll < sum) return entry.level;
  }
  return 1;
}

function levelOf(entry: BankWord): 1 | 2 | 3 {
  return entry.level === 2 || entry.level === 3 ? entry.level : 1;
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
  const wanted = targetLevel();
  const byLevel = pool.filter((entry) => levelOf(entry) === wanted);
  const source = byLevel.length > 0 ? byLevel : pool;
  const entry = source[Math.floor(Math.random() * source.length)]!;
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

function rememberPlayer(code: string, roomId: string, playerId: string) {
  writeMap(PLAYER_KEY, code, playerId);
  writeMap(ROOM_KEY, roomId, playerId);
}

function rememberToken(playerId: string, token: string) {
  writeMap(TOKEN_KEY, playerId, token);
}

export async function createRoom(name: string): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = randomCode();
    try {
      const room = await createRoomFn({ data: { code } });
      if (room) {
        await joinRoom(code, name);
        return code;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      if (!message.includes("duplicate")) throw error;
    }
  }
  throw new Error("Impossible de créer une partie, réessaie.");
}

export async function findRoom(code: string) {
  const room = await findRoomFn({ data: { code: code.toUpperCase() } });
  if (room) {
    // Keep the room -> player mapping fresh so later calls can authenticate.
    const playerId = savedPlayerId(room.code);
    if (playerId) writeMap(ROOM_KEY, room.id, playerId);
  }
  return room;
}

export async function joinRoom(code: string, name: string): Promise<Player> {
  const room = await findRoom(code);
  if (!room) throw new Error("Aucune partie avec ce code.");
  const existingId = savedPlayerId(room.code);
  const existingToken = savedPlayerToken(existingId);
  if (existingId && existingToken) {
    const synced = await syncPlayerFn({
      data: { playerId: existingId, token: existingToken, name },
    }).catch(() => null);
    if (synced) {
      rememberPlayer(room.code, room.id, synced.id);
      return { ...synced, has_word: Boolean(synced.has_word) } as Player;
    }
  }
  const created = await joinRoomFn({ data: { roomId: room.id, name } });
  if (!created) throw new Error("Impossible de rejoindre la partie.");
  rememberPlayer(room.code, room.id, created.id);
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
  const auth = requireAuthForRoom(roomId);
  const data = await listPlayersFn({ data: { ...auth, roomId } });
  return (data ?? []).map((player) => ({
    ...player,
    has_word: Boolean(player.has_word),
  })) as Player[];
}

async function writeWord(playerId: string | null, word: string | null) {
  const token = savedPlayerToken(playerId);
  if (!playerId || !token) return;
  await setPlayerWordFn({ data: { playerId, token, word: word ?? "" } });
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
  await sendSuggestionFn({
    data: {
      playerId: params.authorPlayerId,
      token,
      roomId: params.roomId,
      targetPlayerId: params.targetPlayerId,
      authorName: params.authorName || "Un voisin",
      text,
    },
  });
}

/** Latest still-valid suggestion for a player (older than 10 min is ignored). */
export async function pendingSuggestion(
  playerId: string | null,
): Promise<WordSuggestion | null> {
  const token = savedPlayerToken(playerId);
  if (!playerId || !token) return null;
  const data = await mySuggestionFn({ data: { playerId, token } });
  return (data as WordSuggestion | null) ?? null;
}

export async function resolveSuggestion(
  id: string,
  playerId: string | null,
  status: "used" | "skipped",
) {
  const token = savedPlayerToken(playerId);
  if (!playerId || !token) return;
  await resolveSuggestionFn({ data: { playerId, token, id, status } });
}

export async function useSuggestion(suggestion: WordSuggestion, playerId: string | null) {
  await resolveSuggestion(suggestion.id, playerId, "used");
  await writeWord(playerId, suggestion.text);
  return suggestion.text;
}
