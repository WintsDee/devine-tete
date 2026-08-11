import { motion } from "framer-motion";
import { ArrowLeft, Timer } from "lucide-react";

import { vibrate } from "@/lib/haptics";
import type { Theme } from "@/lib/themes";

export type TeamState = { id: string; name: string; points: number };

/** Grid of the 6 drawn themes: the active team picks one, played ones are greyed out. */
export function ThemeBoard({
  themes,
  usedIds,
  teams,
  activeTeamId,
  round,
  rounds,
  onPick,
  onBack,
}: {
  themes: Theme[];
  usedIds: string[];
  teams: TeamState[];
  activeTeamId: string;
  round: number;
  rounds: number;
  onPick: (theme: Theme) => void;
  onBack: () => void;
}) {
  const activeTeam = teams.find((team) => team.id === activeTeamId);
  const ranking = [...teams].sort((a, b) => b.points - a.points);

  return (
    <main className="party-gradient flex min-h-[100dvh] flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <button
          type="button"
          onClick={() => {
            vibrate("tap");
            onBack();
          }}
          className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-card/70 text-muted-foreground"
          aria-label="Quitter la partie"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="truncate text-lg font-bold">
          Manche {round}/{rounds}
        </h1>
      </header>

      <motion.section
        key={activeTeamId + round}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 rounded-3xl border border-primary bg-card/80 p-5 text-center backdrop-blur"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Au tour de
        </p>
        <p className="text-word text-glow mt-1 font-display text-3xl font-bold [text-wrap:balance]">
          {activeTeam?.name ?? "—"}
        </p>
        <p className="mt-2 flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
          <Timer className="size-4" /> Choisissez votre thème · 3 minutes
        </p>
      </motion.section>

      <section className="mt-5 grid flex-1 grid-cols-2 gap-3 content-start">
        {themes.map((theme, index) => {
          const used = usedIds.includes(theme.id);
          return (
            <motion.button
              key={theme.id}
              type="button"
              disabled={used}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: used ? 0.35 : 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileTap={used ? undefined : { scale: 0.95 }}
              onClick={() => {
                vibrate("tap");
                onPick(theme);
              }}
              className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-3xl border px-3 py-4 text-center ${
                used
                  ? "border-border bg-card/30 text-muted-foreground line-through"
                  : "border-border bg-card/70 text-foreground"
              }`}
            >
              <span className="text-2xl" aria-hidden>
                {theme.emoji}
              </span>
              <span className="text-sm font-bold leading-tight [text-wrap:balance]">
                {theme.label}
              </span>
            </motion.button>
          );
        })}
      </section>

      <section className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Scores
        </p>
        <ul className="mt-2 space-y-2">
          {ranking.map((team) => (
            <li
              key={team.id}
              className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
                team.id === activeTeamId ? "border-primary bg-card/80" : "border-border bg-card/50"
              }`}
            >
              <span className="min-w-0 truncate font-medium">{team.name}</span>
              <span className="text-word font-display text-xl font-bold">{team.points}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
