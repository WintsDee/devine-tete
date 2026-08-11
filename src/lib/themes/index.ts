import type { BankWord } from "@/lib/words-types";
import type { Theme } from "@/lib/themes/types";
import { THEMES_1 } from "@/lib/themes/batch1";
import { THEMES_2 } from "@/lib/themes/batch2";
import { THEMES_3 } from "@/lib/themes/batch3";
import { THEMES_4 } from "@/lib/themes/batch4";

export type { Theme };

const ALL = [...THEMES_1, ...THEMES_2, ...THEMES_3, ...THEMES_4];

/** Deduplicated theme bank (by id). */
export const THEMES: Theme[] = ALL.filter(
  (theme, index) => ALL.findIndex((other) => other.id === theme.id) === index,
);

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

/** Draws `count` random themes, avoiding the given ids when possible. */
export function drawThemes(count: number, excludeIds: string[] = []): Theme[] {
  const excluded = new Set(excludeIds);
  const fresh = shuffle(THEMES.filter((theme) => !excluded.has(theme.id)));
  if (fresh.length >= count) return fresh.slice(0, count);
  const fallback = shuffle(THEMES.filter((theme) => excluded.has(theme.id)));
  return [...fresh, ...fallback].slice(0, count);
}

/** Picks a word inside a theme, avoiding the ones already seen this turn. */
export function pickThemeWord(theme: Theme, seen: string[] = []): BankWord {
  const seenSet = new Set(seen.map((text) => text.toLowerCase()));
  const remaining = theme.words.filter((word) => !seenSet.has(word.text.toLowerCase()));
  const pool = remaining.length > 0 ? remaining : theme.words;
  return pool[Math.floor(Math.random() * pool.length)]!;
}
