import { AUDIO_LANGUAGES, type AudioLanguage } from "./types";

const aliases: Record<string, AudioLanguage> = {
  ja: "Japanese", japanese: "Japanese", jp: "Japanese",
  en: "English", english: "English", eng: "English",
  hi: "Hindi", hindi: "Hindi", hin: "Hindi",
  ta: "Tamil", tamil: "Tamil", tam: "Tamil",
  te: "Telugu", telugu: "Telugu", tel: "Telugu",
  ko: "Korean", korean: "Korean",
  zh: "Chinese", chinese: "Chinese", mandarin: "Chinese",
};

export function normalizeAudioLanguage(value: string | null | undefined): AudioLanguage {
  if (!value?.trim()) return "unknown";
  const normalized = value.trim().toLowerCase();
  if (aliases[normalized]) return aliases[normalized];
  return AUDIO_LANGUAGES.find((language) => normalized.includes(language.toLowerCase())) ?? "unknown";
}

export function getSupportedAudioLanguages(): readonly AudioLanguage[] {
  return AUDIO_LANGUAGES;
}
