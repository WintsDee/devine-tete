const KEY = "dt.haptics";

export type HapticPattern =
  | "tap"
  | "tick"
  | "reveal"
  | "incoming"
  | "end"
  | "score"
  | "skip"
  | "final";

const PATTERNS: Record<HapticPattern, number | number[]> = {
  tap: 8,
  tick: 12,
  reveal: [28, 50, 28, 50, 70],
  incoming: [18, 70, 18],
  end: 40,
  score: [14, 40, 22],
  skip: 10,
  final: [30, 60, 30, 60, 30, 60, 90],
};

export function hapticsEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(KEY) !== "off";
}

export function setHapticsEnabled(enabled: boolean) {
  window.localStorage.setItem(KEY, enabled ? "on" : "off");
}

/** Fires a short, tasteful vibration pattern (no-op where unsupported or muted). */
export function vibrate(pattern: HapticPattern) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  if (!hapticsEnabled()) return;
  try {
    navigator.vibrate?.(PATTERNS[pattern]);
  } catch {
    /* ignore */
  }
}
