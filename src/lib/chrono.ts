import { supabase } from "@/integrations/supabase/client";

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

export type RoundResult = { points: number; found: string[]; skipped: string[] };

export const TEAM_COLORS = ["yellow", "pink", "cyan", "lime", "orange", "violet"] as const;

export const CHRONO_SECONDS = 180;

export async function listTeams(roomId: string): Promise<Team[]> {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Team[];
}

export async function listTeamMembers(teamIds: string[]): Promise<TeamMember[]> {
  if (teamIds.length === 0) return [];
  const { data, error } = await supabase
    .from("team_members")
    .select("id, team_id, player_id")
    .in("team_id", teamIds);
  if (error) throw error;
  return (data ?? []) as TeamMember[];
}

export async function createTeam(roomId: string, name: string, index: number) {
  const color = TEAM_COLORS[index % TEAM_COLORS.length]!;
  const { data, error } = await supabase
    .from("teams")
    .insert({ room_id: roomId, name: name.trim(), color })
    .select("*")
    .single();
  if (error) throw error;
  return data as Team;
}

export async function deleteTeam(teamId: string) {
  const { error } = await supabase.from("teams").delete().eq("id", teamId);
  if (error) throw error;
}

/** Moves a player into a team, leaving any other team of the same room first. */
export async function joinTeam(teamId: string, playerId: string, roomTeamIds: string[]) {
  if (roomTeamIds.length > 0) {
    await supabase
      .from("team_members")
      .delete()
      .eq("player_id", playerId)
      .in("team_id", roomTeamIds);
  }
  const { error } = await supabase
    .from("team_members")
    .insert({ team_id: teamId, player_id: playerId });
  if (error) throw error;
}

export async function activeGame(roomId: string): Promise<ChronoGame | null> {
  const { data, error } = await supabase
    .from("chrono_games")
    .select("*")
    .eq("room_id", roomId)
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  return (data?.[0] as ChronoGame | undefined) ?? null;
}

export async function createGame(roomId: string, rounds: number, firstTeamId: string) {
  await supabase.from("chrono_games").update({ status: "archived" }).eq("room_id", roomId);
  const { data, error } = await supabase
    .from("chrono_games")
    .insert({
      room_id: roomId,
      rounds,
      current_round: 1,
      current_team_id: firstTeamId,
      status: "waiting",
      duration_seconds: CHRONO_SECONDS,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as ChronoGame;
}

export async function archiveGame(gameId: string) {
  await supabase.from("chrono_games").update({ status: "archived" }).eq("id", gameId);
}

export async function startTurn(game: ChronoGame) {
  const endsAt = new Date(Date.now() + game.duration_seconds * 1000).toISOString();
  const { error } = await supabase
    .from("chrono_games")
    .update({ status: "playing", turn_ends_at: endsAt })
    .eq("id", game.id);
  if (error) throw error;
}

export async function listScores(gameId: string): Promise<ChronoScore[]> {
  const { data, error } = await supabase
    .from("chrono_scores")
    .select("*")
    .eq("game_id", gameId)
    .order("round", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ChronoScore[];
}

/** Saves the finished turn and hands over to the next team, round or the final screen. */
export async function submitTurn(game: ChronoGame, teams: Team[], result: RoundResult) {
  if (game.current_team_id) {
    await supabase.from("chrono_scores").upsert(
      {
        game_id: game.id,
        team_id: game.current_team_id,
        round: game.current_round,
        points: result.points,
        found_words: result.found,
        skipped_words: result.skipped,
      },
      { onConflict: "game_id,team_id,round" },
    );
  }
  const index = teams.findIndex((team) => team.id === game.current_team_id);
  const next = teams[index + 1];
  if (next) {
    await supabase
      .from("chrono_games")
      .update({ current_team_id: next.id, status: "waiting", turn_ends_at: null })
      .eq("id", game.id);
    return;
  }
  if (game.current_round < game.rounds && teams[0]) {
    await supabase
      .from("chrono_games")
      .update({
        current_round: game.current_round + 1,
        current_team_id: teams[0].id,
        status: "waiting",
        turn_ends_at: null,
      })
      .eq("id", game.id);
    return;
  }
  await supabase
    .from("chrono_games")
    .update({ status: "finished", turn_ends_at: null })
    .eq("id", game.id);
}

export function totalsByTeam(scores: ChronoScore[]): Record<string, number> {
  return scores.reduce<Record<string, number>>((acc, score) => {
    acc[score.team_id] = (acc[score.team_id] ?? 0) + score.points;
    return acc;
  }, {});
}