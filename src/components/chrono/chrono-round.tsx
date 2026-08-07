import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, SkipForward, Timer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { pickWord } from "@/lib/game";
import { endSound, scoreSound, skipSound, tickSound, unlockAudio } from "@/lib/sfx";
import { VALUE_LABEL, wordValue } from "@/lib/difficulty";
import type { BankWord } from "@/lib/words-types";
import type { FoundWord, RoundResult } from "@/lib/chrono";

function format(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

type Props = {
  durationSeconds: number;
  label?: string;
  onFinish: (result: RoundResult) => void;
};

/** A timed guessing turn: the holder reads the word aloud and taps Trouvé or Passer. */
export function ChronoRound({ durationSeconds, label, onFinish }: Props) {
  const [left, setLeft] = useState(durationSeconds);
  const [word, setWord] = useState<BankWord>(() => pickWord());
  const [points, setPoints] = useState(0);
  const [flash, setFlash] = useState<"found" | "skip" | null>(null);
  const found = useRef<FoundWord[]>([]);
  const skipped = useRef<string[]>([]);
  const done = useRef(false);
  const value = wordValue(word);

  useWakeLock(true);

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    endSound();
    onFinish({
      points: found.current.reduce((total, item) => total + item.value, 0),
      found: found.current,
      skipped: skipped.current,
    });
  }, [onFinish]);

  useEffect(() => {
    void unlockAudio();
    const interval = setInterval(() => {
      setLeft((current) => {
        const next = current - 1;
        if (next <= 0) {
          clearInterval(interval);
          finish();
          return 0;
        }
        if (next <= 5) tickSound(next);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [finish]);

  const next = (kind: "found" | "skip") => {
    if (done.current) return;
    if (kind === "found") {
      found.current = [...found.current, { text: word.text, value }];
      setPoints((current) => current + value);
      scoreSound();
    } else {
      skipped.current = [...skipped.current, word.text];
      skipSound();
    }
    setFlash(kind);
    setTimeout(() => setFlash(null), 220);
    setWord(pickWord());
  };

  const progress = Math.max(0, Math.min(1, left / durationSeconds));

  return (
    <main className="flex min-h-[100dvh] flex-col bg-black">
      <div className="px-5 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          <span className="flex items-center gap-2">
            <Timer className="size-4" />
            {format(left)}
          </span>
          {label ? <span className="truncate text-center">{label}</span> : null}
          <span className="text-word">
            {points} pt{points > 1 ? "s" : ""}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-card">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.4, ease: "linear" }}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-8 text-center">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={word.text}
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.94 }}
            transition={{ duration: 0.22 }}
            className="flex flex-col items-center gap-4"
          >
            <span
              className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest ${
                value === 1
                  ? "border-border text-muted-foreground"
                  : "border-primary text-primary"
              }`}
            >
              +{value} · {VALUE_LABEL[value]}
            </span>
            <p className="text-word text-glow font-display text-[clamp(2.5rem,12vw,6rem)] font-bold uppercase leading-[0.95] [text-wrap:balance]">
              {word.text}
            </p>
            {word.hint ? (
              <p className="max-w-sm text-sm text-muted-foreground [text-wrap:balance]">
                {word.hint}
              </p>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button
          variant="outline"
          onClick={() => next("skip")}
          className={`h-20 flex-col gap-1 rounded-3xl text-sm font-bold ${flash === "skip" ? "opacity-60" : ""}`}
        >
          <SkipForward className="size-6" />
          Passer
        </Button>
        <Button
          onClick={() => next("found")}
          className={`h-20 flex-col gap-1 rounded-3xl text-sm font-bold ${flash === "found" ? "scale-95" : ""}`}
        >
          <Check className="size-6" />
          Trouvé
        </Button>
      </div>
    </main>
  );
}