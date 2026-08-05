import { vibrate, type HapticPattern } from "./haptics";

const KEY = "dt.sound";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const Ctx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  try {
    ctx = new Ctx();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    return ctx;
  } catch {
    return null;
  }
}

export function soundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(KEY) !== "off";
}

export function setSoundEnabled(enabled: boolean) {
  window.localStorage.setItem(KEY, enabled ? "on" : "off");
  if (enabled) void unlockAudio();
}

/** Resume the audio context from a user gesture so iOS allows playback later. */
export async function unlockAudio() {
  const context = audio();
  if (context && context.state === "suspended") {
    try {
      await context.resume();
    } catch {
      /* ignore */
    }
  }
}

type ToneOptions = {
  freq: number;
  start?: number;
  duration?: number;
  gain?: number;
  type?: OscillatorType;
};

function tone({ freq, start = 0, duration = 0.22, gain = 0.22, type = "sine" }: ToneOptions) {
  const context = audio();
  if (!context || !master) return;
  const at = context.currentTime + start;
  const osc = context.createOscillator();
  const env = context.createGain();
  const filter = context.createBiquadFilter();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(Math.max(1200, freq * 4), at);

  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(gain, at + 0.02);
  env.gain.exponentialRampToValueAtTime(0.0001, at + duration);

  osc.connect(filter).connect(env).connect(master);
  osc.start(at);
  osc.stop(at + duration + 0.05);
}

const NOTE = {
  E4: 329.63,
  G4: 392,
  A4: 440,
  B4: 493.88,
  C5: 523.25,
  E5: 659.25,
  G5: 783.99,
  B5: 987.77,
  E6: 1318.51,
} as const;

function play(name: HapticPattern, step = 0) {
  if (!soundEnabled()) return;
  void unlockAudio();
  switch (name) {
    case "tick": {
      // 5 -> 1: same soft note climbing a scale, last tick brighter.
      const scale = [NOTE.E4, NOTE.G4, NOTE.A4, NOTE.B4, NOTE.C5];
      const freq = scale[Math.min(Math.max(step, 0), scale.length - 1)] ?? NOTE.A4;
      tone({ freq, duration: 0.14, gain: 0.14, type: "triangle" });
      break;
    }
    case "reveal": {
      tone({ freq: NOTE.E5, duration: 0.5, gain: 0.2 });
      tone({ freq: NOTE.G5, start: 0.09, duration: 0.5, gain: 0.16 });
      tone({ freq: NOTE.B5, start: 0.18, duration: 0.7, gain: 0.13 });
      break;
    }
    case "incoming": {
      tone({ freq: NOTE.B5, duration: 0.18, gain: 0.16, type: "sine" });
      tone({ freq: NOTE.E6, start: 0.1, duration: 0.26, gain: 0.12, type: "sine" });
      break;
    }
    case "end": {
      tone({ freq: NOTE.C5, duration: 0.28, gain: 0.14, type: "triangle" });
      tone({ freq: NOTE.G4, start: 0.12, duration: 0.4, gain: 0.12, type: "triangle" });
      break;
    }
    case "score": {
      tone({ freq: NOTE.G5, duration: 0.16, gain: 0.16, type: "sine" });
      tone({ freq: NOTE.B5, start: 0.07, duration: 0.22, gain: 0.13, type: "sine" });
      break;
    }
    case "skip": {
      tone({ freq: NOTE.A4, duration: 0.12, gain: 0.1, type: "triangle" });
      tone({ freq: NOTE.E4, start: 0.07, duration: 0.18, gain: 0.09, type: "triangle" });
      break;
    }
    case "final": {
      tone({ freq: NOTE.C5, duration: 0.5, gain: 0.18 });
      tone({ freq: NOTE.E5, start: 0.12, duration: 0.5, gain: 0.16 });
      tone({ freq: NOTE.G5, start: 0.24, duration: 0.6, gain: 0.14 });
      tone({ freq: NOTE.E6, start: 0.36, duration: 0.9, gain: 0.12 });
      break;
    }
  }
}

function cue(name: HapticPattern, step = 0) {
  play(name, step);
  vibrate(name);
}

/** Countdown tick; `remaining` is the number still shown (5 → 1). */
export const tickSound = (remaining: number) => cue("tick", 5 - remaining);
export const revealSound = () => cue("reveal");
export const incomingSound = () => cue("incoming");
export const endSound = () => cue("end");
export const scoreSound = () => cue("score");
export const skipSound = () => cue("skip");
export const finalSound = () => cue("final");
