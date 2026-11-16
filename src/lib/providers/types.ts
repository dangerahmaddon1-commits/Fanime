export const AUDIO_LANGUAGES = [
  "Japanese",
  "English",
  "Hindi",
  "Tamil",
  "Telugu",
  "Korean",
  "Chinese",
] as const;

export type AudioLanguage = (typeof AUDIO_LANGUAGES)[number] | "unknown";
export type SubtitleMode = "sub" | "dub" | "both";

export interface ProviderAnime { id: string; title: string; url?: string; languages?: AudioLanguage[]; }
export interface ProviderEpisode { id: string; number: number; title?: string; url?: string; languages?: AudioLanguage[]; }
export interface ProviderSource { id: string; url: string; type: "hls" | "mp4" | "iframe"; quality?: string; language?: AudioLanguage; subtitleMode?: SubtitleMode; referer?: string; }
export interface SearchOptions { query: string; languages?: AudioLanguage[]; }
export interface EpisodeOptions { animeId: string; season?: number; languages?: AudioLanguage[]; }
export interface SourceOptions { episodeId: string; language?: AudioLanguage; }

export interface AnimeProvider {
  readonly id: string;
  search(options: SearchOptions): Promise<ProviderAnime[]>;
  episodes(options: EpisodeOptions): Promise<ProviderEpisode[]>;
  sources(options: SourceOptions): Promise<ProviderSource[]>;
}

export class ProviderError extends Error {
  constructor(message: string, public readonly providerId: string) { super(message); this.name = "ProviderError"; }
}
