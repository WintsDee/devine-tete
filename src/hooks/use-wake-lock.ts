import { useEffect } from "react";

type WakeLockSentinel = { release: () => Promise<void> };

/** Keeps the screen awake while `active` is true (no-op where unsupported). */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof navigator === "undefined") return;
    const wakeLock = (
      navigator as unknown as {
        wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinel> };
      }
    ).wakeLock;
    if (!wakeLock) return;

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const acquire = () => {
      wakeLock
        .request("screen")
        .then((lock) => {
          if (cancelled) void lock.release();
          else sentinel = lock;
        })
        .catch(() => {});
    };

    acquire();
    const onVisible = () => {
      if (document.visibilityState === "visible") acquire();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void sentinel?.release().catch(() => {});
    };
  }, [active]);
}