import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  EyeOff,
  Keyboard,
  Lightbulb,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Shuffle,
  Volume2,
  VolumeX,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { drawWord } from "@/lib/game";
import {
  endSound,
  revealSound,
  setSoundEnabled,
  soundEnabled,
  tickSound,
  unlockAudio,
} from "@/lib/sfx";
import { setHapticsEnabled, vibrate } from "@/lib/haptics";
import type { BankWord } from "@/lib/words-types";

export const Route = createFileRoute("/solo")({
  head: () => ({
    meta: [
      { title: "Partie rapide — Devine Tête" },
      {
        name: "description",
        content:
          "Joue tout de suite sans code ni lobby : tire un mot, colle l'écran sur ton front et fais deviner.",
      },
      { property: "og:title", content: "Partie rapide — Devine Tête" },
      {
        property: "og:description",
        content: "Un mot, un décompte, ton front. Aucune inscription requise.",
      },
    ],
  }),
  component: Solo,
});

type Phase = "idle" | "countdown" | "front" | "hidden";

const FRONT_SECONDS = 10;

function Solo() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("idle");
  const [word, setWord] = useState<BankWord | null>(null);
  const [count, setCount] = useState(5);
  const [frontLeft, setFrontLeft] = useState(FRONT_SECONDS);
  const [held, setHeld] = useState(false);
  const [hintStep, setHintStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [sound, setSound] = useState(true);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualWord, setManualWord] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useWakeLock(phase !== "idle");

  useEffect(() => {
    setSound(soundEnabled());
  }, []);

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    setSoundEnabled(next);
    setHapticsEnabled(next);
  };

  const stopTimer = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  const startCountdown = useCallback(() => {
    stopTimer();
    void unlockAudio();
    setCount(5);
    setFrontLeft(FRONT_SECONDS);
    setHeld(false);
    setHintStep(0);
    setPhase("countdown");
    tickSound(5);
    timer.current = setInterval(() => {
      setCount((current) => {
        if (current <= 1) {
          stopTimer();
          revealSound();
          setPhase("front");
          return 0;
        }
        tickSound(current - 1);
        return current - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => stopTimer, []);

  useEffect(() => {
    if (phase !== "front") return;
    if (held) return;
    const interval = setInterval(() => {
      setFrontLeft((left) => {
        if (left <= 1) {
          clearInterval(interval);
          endSound();
          setPhase("hidden");
          return 0;
        }
        return left - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, held]);

  useEffect(() => {
    if (phase === "front") setFrontLeft(FRONT_SECONDS);
  }, [phase]);

  const newWord = async () => {
    setBusy(true);
    try {
      setWord(await drawWord(null));
      startCountdown();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de tirer un mot.");
    } finally {
      setBusy(false);
    }
  };

  const playManualWord = () => {
    const text = manualWord.trim();
    if (!text) return;
    setManualOpen(false);
    setManualWord("");
    setWord({ text, category: "Manuel" });
    startCountdown();
  };

  const endTurn = () => {
    stopTimer();
    endSound();
    setWord(null);
    setPhase("idle");
  };

  if (phase === "front" && word) {
    return (
      <main className="flex min-h-[100dvh] flex-col bg-black">
        <p className="pt-[max(0.75rem,env(safe-area-inset-top))] text-center text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          {held ? "En pause" : `Caché dans ${frontLeft} s`}
        </p>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10">
          {hintStep >= 1 ? (
            <motion.p
              key={word.category}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground"
            >
              {word.category}
            </motion.p>
          ) : null}
          <motion.p
            key={word.text}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="text-word text-glow text-center font-display font-bold uppercase leading-[0.95] [text-wrap:balance] text-[clamp(3rem,17vw,9rem)] landscape:text-[clamp(3rem,13vh,11rem)]"
          >
            {word.text}
          </motion.p>
          {word.hint && hintStep >= 2 ? (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md text-center text-sm text-muted-foreground [text-wrap:balance]"
            >
              {word.hint}
            </motion.p>
          ) : null}
        </div>
        <div className="grid grid-cols-5 gap-1 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button
            variant="ghost"
            onClick={() => {
              vibrate("tap");
              setHintStep((current) => Math.min(current + 1, word.hint ? 2 : 1));
            }}
            disabled={hintStep >= (word.hint ? 2 : 1)}
            className={`h-14 flex-col gap-1 rounded-xl text-[11px] font-semibold hover:text-foreground ${hintStep > 0 ? "text-primary" : "text-muted-foreground"}`}
          >
            <Lightbulb className="size-4" />
            Indice
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              vibrate("tap");
              setHeld((current) => !current);
            }}
            className={`h-14 flex-col gap-1 rounded-xl text-[11px] font-semibold hover:text-foreground ${held ? "text-primary" : "text-muted-foreground"}`}
          >
            {held ? <Play className="size-4" /> : <Pause className="size-4" />}
            Hold
          </Button>
          <Button
            variant="ghost"
            onClick={startCountdown}
            className="h-14 flex-col gap-1 rounded-xl text-[11px] font-semibold text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-4" />
            Revoir le mot
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
            onClick={endTurn}
            className="h-14 flex-col gap-1 rounded-xl text-[11px] font-semibold text-muted-foreground hover:text-foreground"
          >
            <Check className="size-4" />
            Fin du tour
          </Button>
        </div>
      </main>
    );
  }

  if (phase === "hidden") {
    return (
      <main className="flex min-h-[100dvh] flex-col bg-black">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <EyeOff className="size-10 text-muted-foreground" />
          <p className="font-display text-3xl font-bold">Mot caché</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Tu peux reprendre ton téléphone : personne ne voit plus le mot.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button
            variant="ghost"
            onClick={() => {
              vibrate("tap");
              startCountdown();
            }}
            className="h-14 flex-col gap-1 rounded-xl text-[11px] font-semibold text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-4" />
            Revoir le mot
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
            onClick={endTurn}
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
        <Button variant="ghost" onClick={endTurn} className="mt-8 text-xs text-muted-foreground">
          Annuler
        </Button>
      </main>
    );
  }

  return (
    <main className="party-gradient flex min-h-[100dvh] flex-col px-5 pb-10 pt-6">
      <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <button
          type="button"
          onClick={() => {
            vibrate("tap");
            void navigate({ to: "/" });
          }}
          className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-card/70 text-muted-foreground"
          aria-label="Retour à l'accueil"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="truncate text-lg font-bold">Partie rapide</h1>
        <button
          type="button"
          onClick={toggleSound}
          className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-card/70 text-muted-foreground"
          aria-label={sound ? "Couper le son et les vibrations" : "Activer le son et les vibrations"}
        >
          {sound ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
        </button>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <p className="max-w-xs text-sm text-muted-foreground">
          Sans code ni lobby : tire un mot, laisse 5 secondes aux autres, puis colle le téléphone sur
          ton front.
        </p>
        <motion.button
          type="button"
          onClick={() => {
            vibrate("tap");
            newWord();
          }}
          disabled={busy}
          whileTap={{ scale: 0.94 }}
          className="grid size-56 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow disabled:opacity-70"
        >
          <span className="flex flex-col items-center gap-2 font-display text-xl font-bold">
            {busy ? <Loader2 className="size-8 animate-spin" /> : <Wand2 className="size-8" />}
            Obtenir un mot
          </span>
        </motion.button>

        <Button
          variant="outline"
          onClick={() => setManualOpen(true)}
          className="h-12 rounded-2xl px-5 font-semibold"
        >
          <Keyboard className="mr-2 size-4" />
          Écrire un mot à la main
        </Button>
      </div>

      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>Écrire un mot</DialogTitle>
            <DialogDescription>
              Prends le téléphone du joueur, tape le mot, puis rends-lui l'appareil : le décompte de
              5 s démarre.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              playManualWord();
            }}
            className="space-y-4"
          >
            <Input
              autoFocus
              maxLength={60}
              value={manualWord}
              onChange={(event) => setManualWord(event.target.value)}
              placeholder="Ex. Raspoutine"
              className="h-12 rounded-2xl text-base"
            />
            <DialogFooter>
              <Button
                type="submit"
                disabled={!manualWord.trim()}
                className="h-12 w-full rounded-2xl font-bold"
              >
                Lancer avec ce mot
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
