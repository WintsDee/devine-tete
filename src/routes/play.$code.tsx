import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Loader2, RotateCcw, Shuffle, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { beep, clearWord, drawWord, savedPlayerId } from "@/lib/game";

export const Route = createFileRoute("/play/$code")({
  head: () => ({
    meta: [
      { title: "Mon tour — Devine Tête" },
      {
        name: "description",
        content:
          "Tire un mot, laisse 5 secondes aux autres joueurs, puis colle l'écran sur ton front et fais deviner.",
      },
      { property: "og:title", content: "Mon tour — Devine Tête" },
      {
        property: "og:description",
        content: "Tire un mot et fais-le deviner à tes amis.",
      },
    ],
  }),
  component: Play,
});

type Phase = "idle" | "countdown" | "front";

function Play() {
  const { code } = Route.useParams();
  const roomCode = code.toUpperCase();
  const navigate = useNavigate();
  const playerId = savedPlayerId(roomCode);
  const [phase, setPhase] = useState<Phase>("idle");
  const [word, setWord] = useState<string | null>(null);
  const [count, setCount] = useState(5);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useWakeLock(phase !== "idle");

  const stopTimer = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  const startCountdown = useCallback(() => {
    stopTimer();
    setCount(5);
    setPhase("countdown");
    timer.current = setInterval(() => {
      setCount((current) => {
        if (current <= 1) {
          stopTimer();
          beep();
          setPhase("front");
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => stopTimer, []);

  const newWord = async () => {
    setBusy(true);
    try {
      setWord(await drawWord(playerId));
      startCountdown();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de tirer un mot.");
    } finally {
      setBusy(false);
    }
  };

  const endTurn = async () => {
    stopTimer();
    setWord(null);
    setPhase("idle");
    await clearWord(playerId);
  };

  if (phase === "front" && word) {
    return (
      <main className="flex min-h-[100dvh] flex-col bg-black">
        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <motion.p
            key={word}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="text-word text-glow text-center font-display font-bold uppercase leading-[0.95] [text-wrap:balance] text-[clamp(3rem,17vw,9rem)] landscape:text-[clamp(3rem,13vh,11rem)]"
          >
            {word}
          </motion.p>
        </div>
        <div className="grid grid-cols-3 gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button
            variant="ghost"
            onClick={startCountdown}
            className="h-14 flex-col gap-1 rounded-xl text-[11px] font-semibold text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-4" />
            Relancer
          </Button>
          <Button
            variant="ghost"
            onClick={newWord}
            disabled={busy}
            className="h-14 flex-col gap-1 rounded-xl text-[11px] font-semibold text-muted-foreground hover:text-foreground"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Shuffle className="size-4" />}
            Nouveau mot
          </Button>
          <Button
            variant="ghost"
            onClick={() => void endTurn()}
            className="h-14 flex-col gap-1 rounded-xl text-[11px] font-semibold text-muted-foreground hover:text-foreground"
          >
            <Check className="size-4" />
            Fin du tour
          </Button>
        </div>
      </main>
    );
  }

  if (phase === "countdown") {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-black px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Sur le front dans…
        </p>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={count}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.6 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="text-word text-glow font-display text-[9rem] font-bold leading-none"
          >
            {count}
          </motion.span>
        </AnimatePresence>
        <Button
          variant="ghost"
          onClick={() => void endTurn()}
          className="mt-8 text-xs text-muted-foreground"
        >
          Annuler
        </Button>
      </main>
    );
  }

  return (
    <main className="party-gradient flex min-h-[100dvh] flex-col px-5 pb-10 pt-6">
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <button
          type="button"
          onClick={() => void navigate({ to: "/room/$code", params: { code: roomCode } })}
          className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-card/70 text-muted-foreground"
          aria-label="Retour au lobby"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="truncate text-lg font-bold">Ton tour — {roomCode}</h1>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <p className="max-w-xs text-sm text-muted-foreground">
          Tire un mot, laisse 5 secondes aux autres pour le lire, puis colle le téléphone sur ton
          front.
        </p>
        <motion.button
          type="button"
          onClick={newWord}
          disabled={busy}
          whileTap={{ scale: 0.94 }}
          className="grid size-56 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow disabled:opacity-70"
        >
          <span className="flex flex-col items-center gap-2 font-display text-xl font-bold">
            {busy ? <Loader2 className="size-8 animate-spin" /> : <Wand2 className="size-8" />}
            Obtenir un mot
          </span>
        </motion.button>
      </div>
    </main>
  );
}
