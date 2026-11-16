export type AudioLanguage = "sub" | "dub" | "both";

export interface ProviderAnime { id: string; title: string; url?: string; }
export interface ProviderEpisode { id: string; number: number; title?: string; url?: string; }
export interface ProviderSource { id: string; url: string; type: "hls" | "mp4" | "iframe"; quality?: string; language?: AudioLanguage; referer?: string; }
export interface SearchOptions { query: string; }
export interface EpisodeOptions { animeId: string; }
export interface SourceOptions { episodeId: string; }

export interface AnimeProvider {
  readonly id: string;
  search(options: SearchOptions): Promise<ProviderAnime[]>;
  episodes(options: EpisodeOptions): Promise<ProviderEpisode[]>;
  sources(options: SourceOptions): Promise<ProviderSource[]>;
}

export class ProviderError extends Error {
  constructor(message: string, public readonly providerId: string) { super(message); this.name = "ProviderError"; }
}
