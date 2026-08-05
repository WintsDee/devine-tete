/** Difficulty scoring: harder words are worth +2 or +3 points in Chrono mode. */
import type { BankWord } from "@/lib/words-types";

/** Points a word is worth: 1 (facile), 2 (corsé) or 3 (difficile), written by hand in the bank. */
export function wordValue(word: BankWord): 1 | 2 | 3 {
  const level = word.level;
  return level === 2 || level === 3 ? level : 1;
}

export const VALUE_LABEL: Record<1 | 2 | 3, string> = {
  1: "Facile",
  2: "Corsé",
  3: "Difficile",
};
