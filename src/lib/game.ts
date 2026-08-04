import { supabase } from "@/integrations/supabase/client";

export type Player = {
  id: string;
  room_id: string;
  name: string;
  current_word: string | null;
  created_at: string;
};

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const PLAYER_KEY = "dt.player";
const NAME_KEY = "dt.name";

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
  const { count, error: countError } = await supabase
    .from("words")
    .select("id", { count: "exact", head: true });
  if (countError) throw countError;
  const total = count ?? 0;
  if (!total) throw new Error("Aucun mot disponible.");
  const offset = Math.floor(Math.random() * total);
  const { data, error } = await supabase.from("words").select("text").range(offset, offset);
  if (error) throw error;
  const word = data?.[0]?.text;
  if (!word) throw new Error("Aucun mot disponible.");
  if (playerId) {
    await supabase.from("players").update({ current_word: word }).eq("id", playerId);
  }
  return word;
}

export async function clearWord(playerId: string | null) {
  if (!playerId) return;
  await supabase.from("players").update({ current_word: null }).eq("id", playerId);
}

export function beep() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctx) {
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
      setTimeout(() => void ctx.close(), 600);
    }
  } catch {
    /* audio unavailable */
  }
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate?.([120, 60, 120]);
  }
}
