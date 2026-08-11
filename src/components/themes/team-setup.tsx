import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { vibrate } from "@/lib/haptics";

export type TeamDraft = { id: string; name: string };

const DEFAULT_NAMES = ["Les Flamants", "Les Cactus", "Les Tornades"];

/** First screen of the mode: 2 or 3 teams, their names and the number of rounds. */
export function TeamSetup({
  onBack,
  onStart,
}: {
  onBack: () => void;
  onStart: (teams: TeamDraft[]) => void;
}) {
  const [count, setCount] = useState(2);
  const [names, setNames] = useState(DEFAULT_NAMES);
  const rounds = count === 2 ? 3 : 2;

  const teams = names.slice(0, count).map((name, index) => ({
    id: `team-${index + 1}`,
    name: name.trim() || DEFAULT_NAMES[index]!,
  }));

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
          aria-label="Retour à l'accueil"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="truncate text-lg font-bold">Thèmes par équipes</h1>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mt-8 w-full max-w-sm flex-1 space-y-8"
      >
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Nombre d'équipes
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[2, 3].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  vibrate("tap");
                  setCount(value);
                }}
                className={`flex h-16 items-center justify-center gap-2 rounded-2xl border text-lg font-bold transition-colors ${
                  count === value
                    ? "border-primary bg-card text-foreground"
                    : "border-border bg-card/50 text-muted-foreground"
                }`}
              >
                <Users className="size-5" />
                {value} équipes
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Noms des équipes
          </p>
          {teams.map((team, index) => (
            <Input
              key={team.id}
              value={names[index] ?? ""}
              onChange={(event) =>
                setNames((current) =>
                  current.map((name, position) =>
                    position === index ? event.target.value.slice(0, 20) : name,
                  ),
                )
              }
              placeholder={DEFAULT_NAMES[index]}
              className="h-14 rounded-2xl text-base font-semibold"
            />
          ))}
        </section>

        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Manches
          </p>
          <div className="mt-3 rounded-2xl border border-border bg-card/50 px-4 py-4 text-center">
            <p className="text-word font-display text-2xl font-bold">
              {rounds} manches · 6 thèmes
            </p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              1 min 30 par équipe, tous les thèmes tirés au sort seront joués.
            </p>
          </div>
        </section>
      </motion.div>

      <Button
        onClick={() => onStart(teams)}
        className="mx-auto mt-6 h-16 w-full max-w-sm rounded-2xl text-base font-bold"
      >
        <Play className="size-5" />
        Commencer
      </Button>
    </main>
  );
}
