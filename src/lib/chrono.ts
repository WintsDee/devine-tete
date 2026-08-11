import {
  activeGameFn,
  archiveGameFn,
  createGameFn,
  createTeamFn,
  deleteTeamFn,
  joinTeamFn,
  listScoresFn,
  listTeamMembersFn,
  listTeamsFn,
  startTurnFn,
  submitTurnFn,
} from "@/lib/api.functions";
import { authForRoom, type Auth } from "@/lib/game";

export type Team = {
  id: string;
  room_id: string;
  name: string;
  color: string;
  created_at: string;
};

export type TeamMember = {
  id: string;
  team_id: string;
  player_id: string;
};

export type ChronoGame = {
  id: string;
  room_id: string;
  rounds: number;
  current_round: number;
  current_team_id: string | null;
  status: string;
  turn_ends_at: string | null;
  duration_seconds: number;
};

export type ChronoScore = {
  id: string;
  game_id: string;
  team_id: string;
  round: number;
  points: number;
  found_words: unknown;
  skipped_words: unknown;
};

export type FoundWord = { text: string; value: number };

export type RoundResult = {
  points: number;
  found: FoundWord[];
  skipped: string[];
  /** Every word shown during the turn, including the one on screen at the buzzer. */
  seen?: string[];
};

export const TEAM_COLORS = ["yellow", "pink", "cyan", "lime", "orange", "violet"] as const;

export const CHRONO_SECONDS = 180;

/** Turn length for the "Thèmes par équipes" mode: 1 min 30. */
export const THEME_SECONDS = 90;

function auth(roomId: string): Auth {
  const found = authForRoom(roomId);
  if (!found) throw new Error("Rejoins la partie avec ton pseudo.");
  return found;
}

export async function listTeams(roomId: string): Promise<Team[]> {
  const data = await listTeamsFn({ data: { ...auth(roomId), roomId } });
  return (data ?? []) as Team[];
}

export async function listTeamMembers(roomId: string): Promise<TeamMember[]> {
  const data = await listTeamMembersFn({ data: { ...auth(roomId), roomId } });
  return (data ?? []) as TeamMember[];
}

export async function createTeam(roomId: string, name: string, index: number) {
  const color = TEAM_COLORS[index % TEAM_COLORS.length]!;
  const data = await createTeamFn({
    data: { ...auth(roomId), roomId, name: name.trim(), color },
  });
  return data as Team;
}

export async function deleteTeam(roomId: string, teamId: string) {
  await deleteTeamFn({ data: { ...auth(roomId), teamId } });
}

/** Moves the current player into a team of its own room. */
export async function joinTeam(roomId: string, teamId: string) {
  await joinTeamFn({ data: { ...auth(roomId), teamId } });
}

export async function activeGame(roomId: string): Promise<ChronoGame | null> {
  const data = await activeGameFn({ data: { ...auth(roomId), roomId } });
  return (data as ChronoGame | null) ?? null;
}

export async function createGame(roomId: string, rounds: number, firstTeamId: string) {
  const data = await createGameFn({
    data: {
      ...auth(roomId),
      roomId,
      rounds,
      firstTeamId,
      durationSeconds: CHRONO_SECONDS,
    },
  });
  return data as ChronoGame;
}

export async function archiveGame(roomId: string, gameId: string) {
  await archiveGameFn({ data: { ...auth(roomId), gameId } });
}

export async function startTurn(game: ChronoGame) {
  await startTurnFn({ data: { ...auth(game.room_id), gameId: game.id } });
}

export async function listScores(roomId: string, gameId: string): Promise<ChronoScore[]> {
  const data = await listScoresFn({ data: { ...auth(roomId), gameId } });
  return (data ?? []) as ChronoScore[];
}

/** Saves the finished turn; the server hands over to the next team, round or final screen. */
export async function submitTurn(game: ChronoGame, result: RoundResult) {
  await submitTurnFn({
    data: {
      ...auth(game.room_id),
      gameId: game.id,
      points: result.points,
      found: result.found,
      skipped: result.skipped,
    },
  });
}

export function totalsByTeam(scores: ChronoScore[]): Record<string, number> {
  return scores.reduce<Record<string, number>>((acc, score) => {
    acc[score.team_id] = (acc[score.team_id] ?? 0) + score.points;
    return acc;
  }, {});
}
