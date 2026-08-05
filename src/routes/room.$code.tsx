import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  MessageSquareQuote,
  Play,
  Plus,
  Timer,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  findRoom,
  joinRoom,
  listPlayers,
  savedName,
  savedPlayerId,
  sendSuggestion,
  type Player,
} from "@/lib/game";
import { unlockAudio } from "@/lib/sfx";
import {
  activeGame,
  createGame,
  createTeam,
  deleteTeam,
  joinTeam,
  listTeamMembers,
  listTeams,
  type Team,
  type TeamMember,
} from "@/lib/chrono";

export const Route = createFileRoute("/room/$code")({
  head: () => ({
    meta: [
      { title: "Salle d'attente — Devine Tête" },
      {
        name: "description",
        content: "Partage le code ou le QR code de ta partie et vois les joueurs arriver en direct.",
      },
      { property: "og:title", content: "Salle d'attente — Devine Tête" },
      {
        property: "og:description",
        content: "Partage le code de ta partie et lance ton tour.",
      },
    ],
  }),
  component: Lobby,
});

function Lobby() {
  const { code } = Route.useParams();
  const roomCode = code.toUpperCase();
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [joinUrl, setJoinUrl] = useState("");
  const [target, setTarget] = useState<Player | null>(null);
  const [suggestionText, setSuggestionText] = useState("");
  const [sending, setSending] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [rounds, setRounds] = useState(1);
  const [launching, setLaunching] = useState(false);
  const myId = savedPlayerId(roomCode);

  useEffect(() => {
    setJoinUrl(`${window.location.origin}/?room=${roomCode}`);
  }, [roomCode]);

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
        if (!savedPlayerId(roomCode) && savedName()) {
          await joinRoom(roomCode, savedName());
        }
        if (cancelled) return;
        setRoomId(room.id);
        setPlayers(await listPlayers(room.id));
        setTeams(await listTeams(room.id));
        setMembers(await listTeamMembers(room.id));
        const running = await activeGame(room.id);
        if (running && running.status !== "finished") {
          await navigate({ to: "/room/$code/chrono", params: { code: roomCode } });
          return;
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erreur de chargement.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roomCode, navigate]);

  // Game data is server-guarded, so the lobby polls its own room instead of
  // subscribing to raw table changes.
  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const [nextPlayers, nextTeams, nextMembers, running] = await Promise.all([
          listPlayers(roomId),
          listTeams(roomId),
          listTeamMembers(roomId),
          activeGame(roomId),
        ]);
        if (cancelled) return;
        setPlayers(nextPlayers);
        setTeams(nextTeams);
        setMembers(nextMembers);
        if (running && running.status !== "finished") {
          await navigate({ to: "/room/$code/chrono", params: { code: roomCode } });
        }
      } catch {
        // Transient network hiccups keep the last known state.
      }
    };
    const interval = setInterval(() => void poll(), 2500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [roomId, navigate, roomCode]);

  const myTeamId = members.find((member) => member.player_id === myId)?.team_id ?? null;

  const refreshTeams = async (id: string) => {
    const nextTeams = await listTeams(id);
    setTeams(nextTeams);
    setMembers(await listTeamMembers(id));
    return nextTeams;
  };

  const teamPlayers = (teamId: string) =>
    members
      .filter((member) => member.team_id === teamId)
      .map((member) => players.find((player) => player.id === member.player_id)?.name)
      .filter(Boolean) as string[];

  const addTeam = async () => {
    if (!roomId) return;
    try {
      const current = await refreshTeams(roomId);
      await createTeam(roomId, `Équipe ${current.length + 1}`, current.length);
      await refreshTeams(roomId);
    } catch {
      toast.error("Impossible de créer l'équipe.");
    }
  };

  const pickTeam = async (teamId: string) => {
    if (!myId) {
      toast.error("Rejoins d'abord la partie avec ton pseudo.");
      return;
    }
    try {
      await joinTeam(roomId ?? "", teamId);
      if (roomId) await refreshTeams(roomId);
    } catch {
      toast.error("Impossible de rejoindre cette équipe.");
    }
  };

  const launchChrono = async () => {
    if (!roomId) return;
    const ready = teams.filter((team) => teamPlayers(team.id).length > 0);
    if (ready.length < 2) {
      toast.error("Il faut au moins deux équipes avec des joueurs.");
      return;
    }
    setLaunching(true);
    try {
      await createGame(roomId, rounds, ready[0]!.id);
      await navigate({ to: "/room/$code/chrono", params: { code: roomCode } });
    } catch {
      toast.error("Impossible de lancer le Chrono.");
    } finally {
      setLaunching(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Copie impossible, note le code : " + roomCode);
    }
  };

  const openWhisper = (player: Player) => {
    void unlockAudio();
    setSuggestionText("");
    setTarget(player);
  };

  const submitWhisper = async () => {
    if (!target || !roomId) return;
    setSending(true);
    try {
      await sendSuggestion({
        roomId,
        targetPlayerId: target.id,
        authorPlayerId: myId,
        authorName: savedName() || "Un voisin",
        text: suggestionText,
      });
      toast.success(`Mot envoyé à ${target.name}`);
      setTarget(null);
      setSuggestionText("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Envoi impossible.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="party-gradient flex min-h-[100dvh] flex-col px-5 pb-8 pt-6">
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <Link
          to="/"
          className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-card/70 text-muted-foreground"
          aria-label="Retour à l'accueil"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="truncate text-lg font-bold">Salle d'attente</h1>
      </header>

      <motion.section
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mt-6 rounded-3xl border border-border bg-card/80 p-6 text-center backdrop-blur"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Code de la partie
        </p>
        <p className="mt-2 text-6xl font-bold tracking-[0.2em] text-word text-glow">{roomCode}</p>
        <Button variant="secondary" onClick={copyCode} className="mt-4 h-11 rounded-2xl px-5">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Code copié" : "Copier le code"}
        </Button>

        <div className="mt-6 flex flex-col items-center gap-2">
          <div className="rounded-2xl bg-white p-3">
            {joinUrl ? <QRCodeSVG value={joinUrl} size={148} level="M" /> : <div className="size-[148px]" />}
          </div>
          <p className="text-xs text-muted-foreground">Scanne pour rejoindre directement</p>
        </div>
      </motion.section>

      <section className="mt-6 flex-1">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Users className="size-4" />
          Joueurs ({players.length})
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Touche un joueur pour lui souffler un mot de ton choix.
        </p>
        <ul className="mt-3 space-y-2">
          {loading ? (
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Chargement…
            </li>
          ) : (
            players.map((player) => (
              <motion.li
                key={player.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-2xl border border-border bg-card/60"
              >
                <button
                  type="button"
                  onClick={() => openWhisper(player)}
                  disabled={player.id === myId}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left disabled:opacity-100"
                >
                  <span className="truncate font-medium">
                    {player.name}
                    {player.id === myId ? " (toi)" : ""}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {player.has_word ? (
                      <span className="text-xs font-semibold uppercase tracking-wide text-accent">
                        en jeu
                      </span>
                    ) : null}
                    {player.id === myId ? null : (
                      <MessageSquareQuote className="size-4 text-muted-foreground" />
                    )}
                  </span>
                </button>
              </motion.li>
            ))
          )}
        </ul>
      </section>

      <Button
        onClick={() => void navigate({ to: "/play/$code", params: { code: roomCode } })}
        className="mt-6 h-16 w-full rounded-2xl text-lg font-bold"
      >
        <Play className="size-5" />
        Lancer mon tour
      </Button>

      <section className="mt-8 rounded-3xl border border-border bg-card/70 p-5 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-bold">
            <Timer className="size-4 text-primary" />
            Chrono 3 min en équipes
          </p>
          <Button
            variant="ghost"
            onClick={() => void addTeam()}
            className="h-9 rounded-xl px-3 text-xs font-semibold"
          >
            <Plus className="size-4" />
            Équipe
          </Button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Crée des équipes de 2 joueurs ou plus, choisis ton équipe, puis lancez les manches.
        </p>

        <ul className="mt-4 space-y-2">
          {teams.map((team) => (
            <li
              key={team.id}
              className={`flex items-center gap-2 rounded-2xl border px-3 py-2 ${
                team.id === myTeamId ? "border-primary bg-card/90" : "border-border bg-card/50"
              }`}
            >
              <button
                type="button"
                onClick={() => void pickTeam(team.id)}
                className="min-w-0 flex-1 text-left"
              >
                <span className="block truncate text-sm font-semibold">
                  {team.name}
                  {team.id === myTeamId ? " (mon équipe)" : ""}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {teamPlayers(team.id).join(", ") || "Touche pour rejoindre"}
                </span>
              </button>
              <Button
                variant="ghost"
                onClick={async () => {
                  await deleteTeam(roomId ?? "", team.id);
                  if (roomId) await refreshTeams(roomId);
                }}
                className="size-9 shrink-0 rounded-xl p-0 text-muted-foreground"
                aria-label={`Supprimer ${team.name}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Manches
          </span>
          <div className="flex gap-2">
            {[1, 2, 3].map((value) => (
              <Button
                key={value}
                variant={rounds === value ? "default" : "outline"}
                onClick={() => setRounds(value)}
                className="size-10 rounded-xl p-0 font-bold"
              >
                {value}
              </Button>
            ))}
          </div>
        </div>

        <Button
          onClick={() => void launchChrono()}
          disabled={launching}
          className="mt-4 h-14 w-full rounded-2xl text-base font-bold"
        >
          {launching ? <Loader2 className="size-5 animate-spin" /> : <Timer className="size-5" />}
          Lancer le Chrono
        </Button>
      </section>

      <Dialog open={Boolean(target)} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Souffler un mot à {target?.name}</DialogTitle>
            <DialogDescription>
              Il apparaîtra directement sur son écran de jeu, sans qu'il puisse le lire.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={suggestionText}
            maxLength={60}
            placeholder="Ex : Le Radeau de la Méduse"
            onChange={(event) => setSuggestionText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void submitWhisper();
            }}
            className="h-12 rounded-2xl"
          />
          <Button
            onClick={() => void submitWhisper()}
            disabled={sending || suggestionText.trim().length < 1}
            className="h-12 w-full rounded-2xl font-bold"
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : null}
            Envoyer le mot
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
