import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Crown, Hourglass, Loader2, Timer, Trophy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ChronoResult } from "@/components/chrono/chrono-result";
import { ChronoRound } from "@/components/chrono/chrono-round";
import { findRoom, listPlayers, savedPlayerId, type Player } from "@/lib/game";
import {
  activeGame,
  archiveGame,
  listScores,
  listTeamMembers,
  listTeams,
  startTurn,
  submitTurn,
  totalsByTeam,
  type ChronoGame,
  type ChronoScore,
  type RoundResult,
  type Team,
  type TeamMember,
} from "@/lib/chrono";
import { unlockAudio } from "@/lib/sfx";

export const Route = createFileRoute("/room/$code_/chrono")({
  head: () => ({
    meta: [
      { title: "Chrono en équipes — Devine Tête" },
      {
        name: "description",
        content:
          "Les équipes s'affrontent en manches de 3 minutes : scores en direct et classement final animé.",
      },
      { property: "og:title", content: "Chrono en équipes — Devine Tête" },
      {
        property: "og:description",
        content: "Manches de 3 minutes, scores en direct, classement final.",
      },
    ],
  }),
  component: RoomChrono,
});

function secondsLeft(iso: string | null) {
  if (!iso) return 0;
  return Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 1000));
}

function RoomChrono() {
  const { code } = Route.useParams();
  const roomCode = code.toUpperCase();
  const navigate = useNavigate();
  const myId = savedPlayerId(roomCode);

  const [roomId, setRoomId] = useState<string | null>(null);
  const [game, setGame] = useState<ChronoGame | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [scores, setScores] = useState<ChronoScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [turnResult, setTurnResult] = useState<RoundResult | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(async (id: string) => {
    const [nextGame, nextTeams, nextPlayers] = await Promise.all([
      activeGame(id),
      listTeams(id),
      listPlayers(id),
    ]);
    setGame(nextGame);
    setTeams(nextTeams);
    setPlayers(nextPlayers);
    setMembers(await listTeamMembers(id));
    setScores(nextGame ? await listScores(id, nextGame.id) : []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const room = await findRoom(roomCode);
        if (!room) {
          toast.error("Cette partie n'existe pas (ou plus).");
          await navigate({ to: "/" });
          return;
        }
        if (cancelled) return;
        setRoomId(room.id);
        await refresh(room.id);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erreur de chargement.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roomCode, navigate, refresh]);

  // Chrono state lives behind server-side membership checks, so we poll it.
  useEffect(() => {
    if (!roomId) return;
    const interval = setInterval(() => {
      void refresh(roomId).catch(() => {});
    }, 2000);
    return () => clearInterval(interval);
  }, [roomId, refresh]);

  useEffect(() => {
    const interval = setInterval(() => setTick((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const totals = totalsByTeam(scores);
  const myTeamId = members.find((member) => member.player_id === myId)?.team_id ?? null;
  const currentTeam = teams.find((team) => team.id === game?.current_team_id) ?? null;
  const isMyTurn = Boolean(myTeamId && game?.current_team_id === myTeamId);
  const ranking = [...teams].sort((a, b) => (totals[b.id] ?? 0) - (totals[a.id] ?? 0));
  const memberNames = (teamId: string) =>
    members
      .filter((member) => member.team_id === teamId)
      .map((member) => players.find((player) => player.id === member.player_id)?.name)
      .filter(Boolean)
      .join(", ");

  const backToLobby = () => void navigate({ to: "/room/$code", params: { code: roomCode } });

  if (loading) {
    return (
      <main className="party-gradient grid min-h-[100dvh] place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!game) {
    return (
      <main className="party-gradient flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center">
        <Hourglass className="size-10 text-muted-foreground" />
        <p className="font-display text-2xl font-bold">Aucune partie Chrono en cours</p>
        <Button onClick={backToLobby} className="h-12 rounded-2xl px-6 font-bold">
          Retour au lobby
        </Button>
      </main>
    );
  }

  // My team just finished its turn: show the animated recap before handing over.
  if (turnResult) {
    return (
      <ChronoResult result={turnResult} subtitle={`manche ${game.current_round}/${game.rounds}`}>
        <Button onClick={() => setTurnResult(null)} className="h-14 w-full rounded-2xl font-bold">
          Passer la main
        </Button>
      </ChronoResult>
    );
  }

  if (game.status === "playing" && isMyTurn) {
    return (
      <ChronoRound
        durationSeconds={game.duration_seconds}
        label={`${currentTeam?.name ?? "Mon équipe"} · manche ${game.current_round}/${game.rounds}`}
        onFinish={(result) => {
          setTurnResult(result);
          void submitTurn(game, result);
        }}
      />
    );
  }

  if (game.status === "finished") {
    const winner = ranking[0];
    return (
      <main className="party-gradient flex min-h-[100dvh] flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 170, damping: 14 }}
          className="mx-auto grid size-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow"
        >
          <Trophy className="size-8" />
        </motion.div>
        <p className="mt-4 text-center text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Classement final
        </p>
        {winner ? (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-word text-glow mt-2 text-center font-display text-4xl font-bold [text-wrap:balance]"
          >
            {winner.name}
          </motion.p>
        ) : null}

        <ul className="mt-8 flex-1 space-y-3">
          {ranking.map((team, index) => (
            <motion.li
              key={team.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + index * 0.12, type: "spring", stiffness: 150, damping: 16 }}
              className={`flex items-center justify-between gap-3 rounded-3xl border px-4 py-4 ${
                index === 0 ? "border-primary bg-card/90" : "border-border bg-card/60"
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-sm font-bold">
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1 truncate font-semibold">
                    {team.name}
                    {index === 0 ? <Crown className="size-4 text-primary" /> : null}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {memberNames(team.id) || "Sans joueur"}
                  </span>
                </span>
              </span>
              <span className="text-word font-display text-2xl font-bold">
                {totals[team.id] ?? 0}
              </span>
            </motion.li>
          ))}
        </ul>

        <div className="space-y-3">
          <Button
            onClick={async () => {
              await archiveGame(game.room_id, game.id);
              backToLobby();
            }}
            className="h-14 w-full rounded-2xl text-base font-bold"
          >
            Nouvelle partie
          </Button>
          <Button
            variant="ghost"
            onClick={backToLobby}
            className="h-12 w-full rounded-2xl text-sm text-muted-foreground"
          >
            Retour au lobby
          </Button>
        </div>
      </main>
    );
  }

  const remaining = secondsLeft(game.turn_ends_at);
  void tick;

  return (
    <main className="party-gradient flex min-h-[100dvh] flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <button
          type="button"
          onClick={backToLobby}
          className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-card/70 text-muted-foreground"
          aria-label="Retour au lobby"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="truncate text-lg font-bold">
          Manche {game.current_round}/{game.rounds}
        </h1>
      </header>

      <section className="mt-8 rounded-3xl border border-border bg-card/80 p-6 text-center backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {game.status === "playing" ? "En train de jouer" : "Au tour de"}
        </p>
        <p className="text-word text-glow mt-2 font-display text-3xl font-bold [text-wrap:balance]">
          {currentTeam?.name ?? "—"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {currentTeam ? memberNames(currentTeam.id) || "Sans joueur" : ""}
        </p>

        {game.status === "playing" ? (
          <p className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground">
            <Timer className="size-4" />
            {Math.floor(remaining / 60)}:{(remaining % 60).toString().padStart(2, "0")} restant
          </p>
        ) : isMyTurn ? (
          <Button
            onClick={() => {
              void unlockAudio();
              void startTurn(game);
            }}
            className="mt-5 h-14 w-full rounded-2xl text-base font-bold"
          >
            <Timer className="size-5" />
            C'est à nous, démarrer
          </Button>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Ils démarrent leurs 3 minutes sur leur téléphone.
          </p>
        )}
      </section>

      <section className="mt-6 flex-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Scores en direct
        </p>
        <ul className="mt-3 space-y-2">
          {ranking.map((team) => (
            <li
              key={team.id}
              className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
                team.id === game.current_team_id ? "border-primary bg-card/80" : "border-border bg-card/50"
              }`}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">
                  {team.name}
                  {team.id === myTeamId ? " (nous)" : ""}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {memberNames(team.id) || "Sans joueur"}
                </span>
              </span>
              <span className="text-word font-display text-xl font-bold">
                {totals[team.id] ?? 0}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}