import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Check, SkipForward, Trophy } from "lucide-react";

import { finalSound } from "@/lib/sfx";
import type { RoundResult } from "@/lib/chrono";

/** Animated end-of-turn score reveal with the list of words. */
export function ChronoResult({
  result,
  title = "Temps écoulé !",
  subtitle,
  children,
}: {
  result: RoundResult;
  title?: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    finalSound();
    if (result.points === 0) return;
    let current = 0;
    const step = Math.max(30, Math.round(900 / result.points));
    const interval = setInterval(() => {
      current += 1;
      setShown(current);
      if (current >= result.points) clearInterval(interval);
    }, step);
    return () => clearInterval(interval);
  }, [result.points]);

  return (
    <main className="party-gradient flex min-h-[100dvh] flex-col items-center px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: -6 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 14 }}
        className="grid size-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow"
      >
        <Trophy className="size-8" />
      </motion.div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        {title}
      </p>
      <motion.p
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 160, damping: 12 }}
        className="text-word text-glow font-display text-[7rem] font-bold leading-none"
      >
        {shown}
      </motion.p>
      <p className="text-sm font-semibold text-muted-foreground">
        {result.points > 1 ? "mots trouvés" : "mot trouvé"}
        {subtitle ? ` · ${subtitle}` : ""}
      </p>

      <div className="mt-6 w-full max-w-sm flex-1 space-y-2 overflow-y-auto">
        {result.found.map((text, index) => (
          <motion.p
            key={`found-${text}-${index}`}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.04 }}
            className="flex items-center gap-2 rounded-2xl border border-border bg-card/70 px-4 py-2 text-sm font-medium"
          >
            <Check className="size-4 shrink-0 text-primary" />
            <span className="truncate">{text}</span>
          </motion.p>
        ))}
        {result.skipped.map((text, index) => (
          <motion.p
            key={`skip-${text}-${index}`}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 0.7, x: 0 }}
            transition={{ delay: 0.3 + (result.found.length + index) * 0.04 }}
            className="flex items-center gap-2 rounded-2xl border border-border bg-card/40 px-4 py-2 text-sm text-muted-foreground"
          >
            <SkipForward className="size-4 shrink-0" />
            <span className="truncate">{text}</span>
          </motion.p>
        ))}
      </div>

      {children ? <div className="mt-6 w-full max-w-sm space-y-3">{children}</div> : null}
    </main>
  );
}