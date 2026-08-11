import type { BankWord } from "@/lib/words-types";

/** A precise sub-category the teams can pick for a 3-minute turn. */
export type Theme = {
  id: string;
  label: string;
  emoji: string;
  words: BankWord[];
};
