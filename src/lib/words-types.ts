/**
 * Shared shape for word bank entries. `hint` is a one-line description for the clue giver.
 * `level` is the hand-written difficulty: 1 = everybody knows it, 2 = known but less obvious,
 * 3 = known by most people but hard to make someone guess.
 */
export type BankWord = { text: string; category: string; hint?: string; level?: 1 | 2 | 3 };
