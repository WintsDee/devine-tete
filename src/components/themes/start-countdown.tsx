import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { vibrate } from "@/lib/haptics";
import { revealSound, tickSound, unlockAudio } from "@/lib/sfx";

/** Full-screen 5s countdown played before the first word of a turn. */
export function StartCountdown({
  teamName,
  themeLabel,
  seconds = 5,
  onDone,
}: {
  teamName: string;
  themeLabel: string;
  seconds?: number;
  onDone: () => void;
}) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    void unlockAudio();
    tickSound(seconds);
    vibrate("tap");
    const interval = setInterval(() => {
      setLeft((current) => {
        const next = current - 1;
        if (next <= 0) {
          clearInterval(interval);
          revealSound();
          vibrate("tap");
          onDone();
          return 0;
        }
        tickSound(next);
        vibrate("tap");
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds, onDone]);

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-black px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
        {teamName} · {themeLabel}
      </p>
      <AnimatePresence mode="popLayout">
        <motion.p
          key={left}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.6 }}
          transition={{ duration: 0.3 }}
          className="text-word text-glow font-display text-[clamp(6rem,40vw,14rem)] font-bold leading-none"
        >
          {Math.max(1, left)}
        </motion.p>
      </AnimatePresence>
      <p className="text-sm font-semibold text-muted-foreground">Préparez-vous…</p>
    </main>
  );
}
