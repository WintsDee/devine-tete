/** Difficulty scoring: harder words are worth +2 or +3 points in Chrono mode. */
import { WORD_BANK } from "@/lib/words";
import type { BankWord } from "@/lib/words-types";

/** How many bank entries share each category (rare categories are harder to guess). */
const CATEGORY_SHARE: Record<string, number> = (() => {
  const counts: Record<string, number> = {};
  for (const entry of WORD_BANK) counts[entry.category] = (counts[entry.category] ?? 0) + 1;
  const share: Record<string, number> = {};
  for (const [category, count] of Object.entries(counts)) {
    share[category] = count / WORD_BANK.length;
  }
  return share;
})();

/** Points a word is worth: 1 (facile), 2 (corsé) or 3 (difficile). */
export function wordValue(word: BankWord): 1 | 2 | 3 {
  const text = word.text.trim();
  let score = 0;
  if (text.replace(/\s/g, "").length >= 15) score += 1;
  if (text.split(/\s+/).length >= 3) score += 1;
  if ((CATEGORY_SHARE[word.category] ?? 1) < 0.04) score += 1;
  return (1 + Math.min(2, score)) as 1 | 2 | 3;
}

export const VALUE_LABEL: Record<1 | 2 | 3, string> = {
  1: "Facile",
  2: "Corsé",
  3: "Difficile",
};
