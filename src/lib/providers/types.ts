export const AUDIO_LANGUAGES = [
  "Japanese", "English", "Hindi", "Tamil", "Telugu", "Korean", "Chinese",
] as const;

export type AudioLanguage = (typeof AUDIO_LANGUAGES)[number] | "unknown";
export type SubtitleMode = "sub" | "dub" | "both";

export interface ProviderAnime {
  id: string;
  title: string;
  url?: string;
  image?: string;
  type?: "series" | "movie" | "unknown";
  languages?: AudioLanguage[];
}
export interface ProviderEpisode {
  id: string;
  number: number;
  season?: number;
  title?: string;
  image?: string;
  url?: string;
  languages?: AudioLanguage[];
}
export interface ProviderDetails {
  id: string;
  title: string;
  type?: "series" | "movie" | "unknown";
  image?: string;
  background?: string;
  description?: string;
  genres: string[];
  languages: AudioLanguage[];
  year?: string;
  seasons: number[];
  episodes: ProviderEpisode[];
}
export interface ProviderSource {
  id: string;
  url: string;
  type: "hls" | "mp4" | "iframe";
  quality?: string;
  language?: AudioLanguage;
  subtitleMode?: SubtitleMode;
  referer?: string;
}
export interface SearchOptions { query: string; languages?: AudioLanguage[]; }
export interface EpisodeOptions { animeId: string; season?: number; languages?: AudioLanguage[]; }
export interface SourceOptions { episodeId: string; language?: AudioLanguage; }

export interface AnimeProvider {
  readonly id: string;
  search(options: SearchOptions): Promise<ProviderAnime[]>;
  details(animeId: string): Promise<ProviderDetails>;
  episodes(options: EpisodeOptions): Promise<ProviderEpisode[]>;
  sources(options: SourceOptions): Promise<ProviderSource[]>;
}

export class ProviderError extends Error {
  constructor(message: string, public readonly providerId: string) {
    super(message);
    this.name = "ProviderError";
  }
}
