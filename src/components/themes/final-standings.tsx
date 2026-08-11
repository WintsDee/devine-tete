import { useEffect } from "react";
import { motion } from "framer-motion";
import { Crown, Home, PartyPopper, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { finalSound } from "@/lib/sfx";
import { vibrate } from "@/lib/haptics";
import type { TeamState } from "@/components/themes/theme-board";

const CONFETTI = Array.from({ length: 18 }, (_, index) => index);

/** Final ranking with an animated celebration for the winning team. */
export function FinalStandings({
  teams,
  onReplay,
  onHome,
}: {
  teams: TeamState[];
  onReplay: () => void;
  onHome: () => void;
}) {
  const ranking = [...teams].sort((a, b) => b.points - a.points);
  const best = ranking[0]?.points ?? 0;
  const winners = ranking.filter((team) => team.points === best);
  const tie = winners.length > 1;

  useEffect(() => {
    finalSound();
    vibrate("final");
  }, []);

  return (
    <main className="party-gradient relative flex min-h-[100dvh] flex-col overflow-hidden px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-10">
      {CONFETTI.map((index) => (
        <motion.span
          key={index}
          aria-hidden
          initial={{ y: -40, opacity: 0, rotate: 0 }}
          animate={{ y: "110vh", opacity: [0, 1, 1, 0], rotate: 360 }}
          transition={{
            duration: 3.2 + (index % 5) * 0.4,
            delay: (index % 7) * 0.18,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ left: `${(index * 5.6) % 100}%` }}
          className={`pointer-events-none absolute top-0 size-2 rounded-sm ${
            index % 3 === 0 ? "bg-primary" : index % 3 === 1 ? "bg-word" : "bg-neon"
          }`}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 13 }}
        className="mx-auto grid size-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow"
      >
        <PartyPopper className="size-8" />
      </motion.div>

      <p className="mt-4 text-center text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        {tie ? "Égalité parfaite" : "Bravo aux champions"}
      </p>
      <motion.p
        initial={{ opacity: 0, y: 14, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 160, damping: 12 }}
        className="text-word text-glow mt-2 text-center font-display text-4xl font-bold [text-wrap:balance]"
      >
        {winners.map((team) => team.name).join(" & ")}
      </motion.p>

      <ul className="mt-8 flex-1 space-y-3">
        {ranking.map((team, index) => (
          <motion.li
            key={team.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.12, type: "spring", stiffness: 150, damping: 16 }}
            className={`flex items-center justify-between gap-3 rounded-3xl border px-4 py-4 ${
              team.points === best ? "border-primary bg-card/90" : "border-border bg-card/60"
            }`}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-sm font-bold">
                {index + 1}
              </span>
              <span className="flex min-w-0 items-center gap-1 truncate font-semibold">
                {team.name}
                {team.points === best ? <Crown className="size-4 text-primary" /> : null}
              </span>
            </span>
            <span className="text-word font-display text-2xl font-bold">{team.points}</span>
          </motion.li>
        ))}
      </ul>

      <div className="space-y-3">
        <Button
          onClick={() => {
            vibrate("tap");
            onReplay();
          }}
          className="h-14 w-full rounded-2xl text-base font-bold"
        >
          <RotateCcw className="size-5" />
          Rejouer avec les mêmes équipes
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            vibrate("tap");
            onHome();
          }}
          className="h-12 w-full rounded-2xl text-sm text-muted-foreground"
        >
          <Home className="size-4" />
          Retour à l'accueil
        </Button>
      </div>
    </main>
  );
}
