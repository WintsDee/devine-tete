/** Word bank: solo references (2000-2026) + every word of the team themes (~7000 entries). */
import type { BankWord } from "@/lib/words-types";
import { PART_1 } from "@/lib/words/part1";
import { PART_1B } from "@/lib/words/part1b";
import { PART_2 } from "@/lib/words/part2";
import { PART_3 } from "@/lib/words/part3";
import { PART_4 } from "@/lib/words/part4";
import { PART_5 } from "@/lib/words/part5";
import { THEMES } from "@/lib/themes";
import { normalizeWordKey } from "@/lib/word-key";

export type { BankWord };

const THEME_WORDS: BankWord[] = THEMES.flatMap((theme) => theme.words);

const ALL = [
  ...PART_1,
  ...PART_1B,
  ...PART_2,
  ...PART_3,
  ...PART_4,
  ...PART_5,
  ...THEME_WORDS,
];

/** Deduplicated bank (accent- and case-insensitive on text). */
export const WORD_BANK: BankWord[] = (() => {
  const seen = new Set<string>();
  const bank: BankWord[] = [];
  for (const entry of ALL) {
    const key = normalizeWordKey(entry.text);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    bank.push(entry);
  }
  return bank;
})();
