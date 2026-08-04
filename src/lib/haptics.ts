const KEY = "dt.haptics";

export type HapticPattern = "tick" | "reveal" | "incoming" | "end";

const PATTERNS: Record<HapticPattern, number | number[]> = {
  tick: 12,
  reveal: [28, 50, 28, 50, 70],
  incoming: [18, 70, 18],
  end: 40,
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
