import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Check, Copy, Loader2, MessageSquareQuote, Play, Users } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
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

  useEffect(() => {
    if (!roomId) return;
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `room_id=eq.${roomId}` },
        () => {
          void listPlayers(roomId).then(setPlayers);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomId]);

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
                    {player.current_word ? (
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
