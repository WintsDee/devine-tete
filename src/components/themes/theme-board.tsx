import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Timer, X } from "lucide-react";

import { vibrate } from "@/lib/haptics";
import type { Theme } from "@/lib/themes";
import { themeColor, themeIcon } from "@/lib/themes/icons";

export type TeamState = { id: string; name: string; points: number; jokers: number };

/** Grid of the 6 drawn themes: the active team picks one, played ones are greyed out. */
export function ThemeBoard({
  themes,
  usedIds,
  teams,
  activeTeamId,
  round,
  rounds,
  onPick,
  onJoker,
  onBack,
}: {
  themes: Theme[];
  usedIds: string[];
  teams: TeamState[];
  activeTeamId: string;
  round: number;
  rounds: number;
  onPick: (theme: Theme) => void;
  onJoker: (theme: Theme) => void;
  onBack: () => void;
}) {
  const [swapping, setSwapping] = useState(false);
  const activeTeam = teams.find((team) => team.id === activeTeamId);
  const ranking = [...teams].sort((a, b) => b.points - a.points);
  const canJoker = (activeTeam?.jokers ?? 0) > 0;

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
          <Timer className="size-4" />
          {swapping ? "Touchez le thème à remplacer" : "Choisissez votre thème · 1 min 30"}
        </p>
      </motion.section>

      <button
        type="button"
        disabled={!canJoker}
        onClick={() => {
          vibrate("tap");
          setSwapping((current) => !current);
        }}
        className={`mt-3 flex h-12 items-center justify-center gap-2 rounded-2xl border text-sm font-bold ${
          !canJoker
            ? "border-border bg-card/30 text-muted-foreground"
            : swapping
              ? "border-primary bg-card text-foreground"
              : "border-primary bg-card/70 text-foreground"
        }`}
      >
        {swapping ? <X className="size-4" /> : <Sparkles className="size-4" />}
        {!canJoker
          ? "Joker utilisé"
          : swapping
            ? "Annuler le joker"
            : "Joker · changer un thème"}
      </button>

      <section className="mt-4 grid flex-1 grid-cols-2 gap-3 content-start">
        {themes.map((theme, index) => {
          const used = usedIds.includes(theme.id);
          const Icon = themeIcon(theme.id);
          return (
            <motion.button
              key={theme.id}
              type="button"
              disabled={used}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: used ? 0.35 : 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: used ? 1 : 0.95 }}
              onClick={() => {
                vibrate("tap");
                if (swapping) {
                  setSwapping(false);
                  onJoker(theme);
                  return;
                }
                onPick(theme);
              }}
              className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-3xl border px-3 py-4 text-center ${
                used
                  ? "border-border bg-card/30 text-muted-foreground line-through"
                  : swapping
                    ? "border-primary bg-card/70 text-foreground"
                    : "border-border bg-card/70 text-foreground"
              }`}
            >
              <Icon
                className={`size-8 ${used ? "text-muted-foreground" : themeColor(theme.id)}`}
                aria-hidden
              />
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
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate font-medium">{team.name}</span>
                {team.jokers > 0 ? (
                  <Sparkles className="size-4 shrink-0 text-primary" aria-label="joker restant" />
                ) : null}
              </span>
              <span className="text-word font-display text-xl font-bold">{team.points}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
