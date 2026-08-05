/** Word bank: 2000 millennial-friendly references (2000-2026), people, characters & objects. */
import type { BankWord } from "@/lib/words-types";
import { PART_1 } from "@/lib/words/part1";
import { PART_2 } from "@/lib/words/part2";
import { PART_3 } from "@/lib/words/part3";
import { PART_4 } from "@/lib/words/part4";

export type { BankWord };

const ALL = [...PART_1, ...PART_2, ...PART_3, ...PART_4];

/** Deduplicated bank (case-insensitive on text). */
export const WORD_BANK: BankWord[] = ALL.filter(
  (entry, index) =>
    ALL.findIndex((other) => other.text.toLowerCase() === entry.text.toLowerCase()) === index,
);
