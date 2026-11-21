import { useCallback, useEffect, useState } from "react";
import type { SupportedLanguage } from "./i18n";

const TTS_STORAGE_KEY = "impostor_tts_enabled";
const TTS_EVENT = "impostor-tts-change";

const LANG_LOCALES: Record<SupportedLanguage, readonly string[]> = {
  en: ["en-US", "en-GB", "en"],
  pl: ["pl-PL", "pl"],
  es: ["es-ES", "es-MX", "es"],
  de: ["de-DE", "de"],
  fr: ["fr-FR", "fr-CA", "fr"],
};

let currentAudio: HTMLAudioElement | null = null;
const audioQueue: Array<{ text: string; lang: SupportedLanguage }> = [];
let isPlayingAudio = false;
let speechGeneration = 0;

function isWebSpeechSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof SpeechSynthesisUtterance !== "undefined"
  );
}

export function isTtsSupported(): boolean {
  return typeof Audio !== "undefined" || isWebSpeechSupported();
}

function readInitialTtsEnabled(): boolean {
  if (!isTtsSupported()) return false;
  try {
    const saved = localStorage.getItem(TTS_STORAGE_KEY);
    if (saved === "false") return false;
    if (saved === "true") return true;
  } catch {
    // Ignore storage access errors
  }
  return true;
}

export function useTtsEnabled(): [boolean, () => void] {
  const [enabled, setEnabled] = useState<boolean>(() => readInitialTtsEnabled());

  useEffect(() => {
    const handleEvent = (event: Event) => {
      const detail = (event as CustomEvent<boolean>).detail;
      if (typeof detail === "boolean") {
        setEnabled(detail);
      }
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === TTS_STORAGE_KEY) {
        setEnabled(event.newValue !== "false");
      }
    };
    window.addEventListener(TTS_EVENT, handleEvent);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(TTS_EVENT, handleEvent);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const toggle = useCallback(() => {
    if (!isTtsSupported()) return;
    setEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(TTS_STORAGE_KEY, String(next));
      } catch {
        // Ignore storage access errors
      }
      if (!next) stopSpeaking();
      window.dispatchEvent(new CustomEvent(TTS_EVENT, { detail: next }));
      return next;
    });
  }, []);

  return [enabled, toggle];
}

function scoreVoice(voice: SpeechSynthesisVoice, lang: SupportedLanguage): number {
  const voiceLang = voice.lang.toLowerCase();
  const preferred = LANG_LOCALES[lang];
  let score = 0;

  if (voiceLang === preferred[0]?.toLowerCase()) score += 40;
  else if (preferred.some((loc) => voiceLang === loc.toLowerCase())) score += 30;
  else if (voiceLang.startsWith(`${lang.toLowerCase()}-`) || voiceLang === lang.toLowerCase()) score += 20;
  else return -1000;

  const name = voice.name.toLowerCase();
  if (name.includes("google")) score += 100;
  if (name.includes("natural") || name.includes("neural") || name.includes("online")) score += 90;
  if (name.includes("microsoft") || name.includes("apple") || name.includes("siri")) score += 50;
  if (!voice.localService) score += 25;
  if (name.includes("espeak") || name.includes("speech-dispatcher")) score -= 200;

  return score;
}

function pickVoiceForLanguage(lang: SupportedLanguage): SpeechSynthesisVoice | null {
  if (!isWebSpeechSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  let bestVoice: SpeechSynthesisVoice | null = null;
  let bestScore = -1000;

  for (const voice of voices) {
    const s = scoreVoice(voice, lang);
    if (s > bestScore) {
      bestScore = s;
      bestVoice = voice;
    }
  }
  return bestScore > -1000 ? bestVoice : null;
}

function speakWithWebSpeech(text: string, lang: SupportedLanguage, interrupt = false): void {
  if (!isWebSpeechSupported()) return;
  try {
    if (interrupt) {
      window.speechSynthesis.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickVoiceForLanguage(lang);
    utterance.lang = voice?.lang ?? LANG_LOCALES[lang][0];
    if (voice) utterance.voice = voice;
    utterance.rate = 1.15;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore browser speech synthesis errors
  }
}

function playNextQueuedAudio(generation: number): void {
  if (generation !== speechGeneration) return;
  const next = audioQueue.shift();
  if (!next) {
    isPlayingAudio = false;
    return;
  }

  isPlayingAudio = true;
  const url = `/api/tts?lang=${encodeURIComponent(next.lang)}&text=${encodeURIComponent(next.text)}`;
  const audio = new Audio(url);
  audio.playbackRate = 1.18;
  currentAudio = audio;

  const finish = () => {
    if (currentAudio === audio) {
      currentAudio = null;
    }
    playNextQueuedAudio(generation);
  };

  audio.addEventListener("ended", finish, { once: true });
  audio.addEventListener(
    "error",
    () => {
      if (currentAudio === audio) {
        currentAudio = null;
      }
      if (generation === speechGeneration) {
        speakWithWebSpeech(next.text, next.lang, false);
      }
      playNextQueuedAudio(generation);
    },
    { once: true },
  );

  void audio.play().catch(() => {
    if (currentAudio === audio) {
      currentAudio = null;
    }
    if (generation === speechGeneration) {
      speakWithWebSpeech(next.text, next.lang, false);
    }
    playNextQueuedAudio(generation);
  });
}

export function stopSpeaking(): void {
  speechGeneration += 1;
  audioQueue.length = 0;
  isPlayingAudio = false;
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.src = "";
    } catch {
      // Ignore audio cleanup errors
    }
    currentAudio = null;
  }
  if (isWebSpeechSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore speechSynthesis cancel errors
    }
  }
}

export function pitchForParticipantIndex(_index: number): number {
  return 1;
}

export function speakText(
  text: string,
  lang: SupportedLanguage,
  options?: {
    interrupt?: boolean;
    pitch?: number;
    rate?: number;
  },
): void {
  if (!isTtsSupported()) return;
  const trimmed = text.trim();
  if (!trimmed) return;

  if (options?.interrupt) {
    stopSpeaking();
  }

  if (typeof Audio === "undefined") {
    speakWithWebSpeech(trimmed, lang, options?.interrupt);
    return;
  }

  audioQueue.push({ text: trimmed, lang });
  if (!isPlayingAudio) {
    playNextQueuedAudio(speechGeneration);
  }
}
