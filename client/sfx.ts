import { useCallback, useEffect, useState } from "react";

const VOLUME_STORAGE_KEY = "impostor_audio_volume";
const VOLUME_EVENT = "impostor-volume-change";
let sharedAudioCtx: AudioContext | null = null;

export function getAudioVolume(): number {
  if (typeof window === "undefined") return 0.7;
  try {
    const raw = localStorage.getItem(VOLUME_STORAGE_KEY);
    if (raw === null) return 0.7;
    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed)) return 0.7;
    return Math.max(0, Math.min(1, parsed));
  } catch {
    return 0.7;
  }
}

export function setAudioVolume(next: number): void {
  const clamped = Math.max(0, Math.min(1, next));
  try {
    localStorage.setItem(VOLUME_STORAGE_KEY, String(clamped));
  } catch {
    // Ignore storage quota / privacy mode errors.
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(VOLUME_EVENT, { detail: clamped }));
  }
}

export function useAudioVolume(): [number, (next: number) => void] {
  const [volume, setVolumeState] = useState<number>(() => getAudioVolume());
  useEffect(() => {
    const onChange = () => setVolumeState(getAudioVolume());
    window.addEventListener(VOLUME_EVENT, onChange);
    return () => window.removeEventListener(VOLUME_EVENT, onChange);
  }, []);
  const update = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(1, next));
    setVolumeState(clamped);
    setAudioVolume(clamped);
  }, []);
  return [volume, update];
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (sharedAudioCtx && sharedAudioCtx.state !== "closed") return sharedAudioCtx;
  const AudioCtx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  try {
    sharedAudioCtx = new AudioCtx();
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

function resumeCtx(ctx: AudioContext): void {
  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => {});
  }
}

function playTone(
  ctx: AudioContext,
  freq: number,
  endFreq: number,
  duration: number,
  gainPeak: number,
  type: OscillatorType = "sine",
  offset = 0,
): void {
  const vol = getAudioVolume();
  if (vol <= 0) return;
  const scaledPeak = gainPeak * vol;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const start = ctx.currentTime + offset;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (endFreq !== freq) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), start + duration);
  }
  gain.gain.setValueAtTime(0.001, start);
  gain.gain.linearRampToValueAtTime(scaledPeak, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.01);
}

export function playCountdownTick(finalStretch: boolean): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    resumeCtx(ctx);
    playTone(ctx, finalStretch ? 960 : 720, finalStretch ? 960 : 720, 0.11, finalStretch ? 0.22 : 0.16, "sine");
  } catch {
    // Ignore autoplay/WebAudio restrictions.
  }
}

export function playCardSpinSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    resumeCtx(ctx);
    const steps = [0, 0.14, 0.28, 0.44, 0.62, 0.84];
    for (let i = 0; i < steps.length; i += 1) {
      playTone(ctx, 320 + i * 35, 220, 0.06, 0.08, "triangle", steps[i]!);
    }
  } catch {
    // Ignore autoplay/WebAudio restrictions.
  }
}

export function playCardFlipSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    resumeCtx(ctx);
    playTone(ctx, 360, 740, 0.14, 0.14, "triangle");
  } catch {
    // Ignore autoplay/WebAudio restrictions.
  }
}

export function playVoteSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    resumeCtx(ctx);
    playTone(ctx, 480, 640, 0.09, 0.14, "sine");
  } catch {
    // Ignore autoplay/WebAudio restrictions.
  }
}

export function playResultsRevealSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    resumeCtx(ctx);
    playTone(ctx, 523.25, 523.25, 0.18, 0.12, "triangle", 0);
    playTone(ctx, 659.25, 659.25, 0.18, 0.12, "triangle", 0.09);
    playTone(ctx, 783.99, 783.99, 0.28, 0.14, "triangle", 0.18);
  } catch {
    // Ignore autoplay/WebAudio restrictions.
  }
}
