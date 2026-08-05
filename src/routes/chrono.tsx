import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, Timer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ChronoResult } from "@/components/chrono/chrono-result";
import { ChronoRound } from "@/components/chrono/chrono-round";
import { CHRONO_SECONDS, type RoundResult } from "@/lib/chrono";
import { vibrate } from "@/lib/haptics";
import { unlockAudio } from "@/lib/sfx";

export const Route = createFileRoute("/chrono")({
  head: () => ({
    meta: [
      { title: "Chrono 3 min — Devine Tête" },
      {
        name: "description",
        content:
          "Mode duo chronométré : un joueur fait deviner, l'autre trouve un maximum de mots en 3 minutes.",
      },
      { property: "og:title", content: "Chrono 3 min — Devine Tête" },
      {
        property: "og:description",
        content: "Trois minutes, deux joueurs, un maximum de mots à faire deviner.",
      },
    ],
  }),
  component: Chrono,
});

function Chrono() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"intro" | "playing" | "done">("intro");
  const [result, setResult] = useState<RoundResult | null>(null);

  if (phase === "playing") {
    return (
      <ChronoRound
        durationSeconds={CHRONO_SECONDS}
        onFinish={(round) => {
          setResult(round);
          setPhase("done");
        }}
      />
    );
  }

  if (phase === "done" && result) {
    return (
      <ChronoResult result={result}>
        <Button
          onClick={() => {
            setResult(null);
            setPhase("playing");
          }}
          className="h-14 w-full rounded-2xl text-base font-bold"
        >
          <RotateCcw className="size-5" />
          Rejouer 3 minutes
        </Button>
        <Button
          variant="ghost"
          onClick={() => void navigate({ to: "/" })}
          className="h-12 w-full rounded-2xl text-sm text-muted-foreground"
        >
          Retour à l'accueil
        </Button>
      </ChronoResult>
    );
  }

  return (
    <main className="party-gradient flex min-h-[100dvh] flex-col px-5 pb-10 pt-6">
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
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
        <h1 className="truncate text-lg font-bold">Chrono 3 min</h1>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <motion.button
          type="button"
          onClick={() => {
            void unlockAudio();
            vibrate("tap");
            setPhase("playing");
          }}
          whileTap={{ scale: 0.94 }}
          className="grid size-56 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow"
        >
          <span className="flex flex-col items-center gap-2 font-display text-xl font-bold">
            <Timer className="size-8" />
            Démarrer
          </span>
        </motion.button>
      </div>
    </main>
  );
}