import { normalizeAudioLanguage } from "./languages";
import type {
  AnimeProvider, AudioLanguage, EpisodeOptions, ProviderAnime, ProviderDetails,
  ProviderEpisode, ProviderHome, ProviderSource, SearchOptions, SourceOptions,
} from "./types";

type JsonRecord = Record<string, unknown>;
type RenimeServer = { server?: number; name?: string; url?: string };

function record(value: unknown): JsonRecord {
  return value && typeof value === "object" ? value as JsonRecord : {};
}
function unwrap(value: unknown): unknown {
  const root = record(value);
  return root.data ?? root.results ?? value;
}
function stringValue(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}
function list(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const root = record(value);
  for (const key of ["results", "episodes", "servers", "items"]) {
    if (Array.isArray(root[key])) return root[key] as unknown[];
  }
  return [];
}
function safeHttpsUrl(value: unknown): string | undefined {
  const candidate = stringValue(value);
  if (candidate.startsWith("https://")) return candidate;
  if (candidate.startsWith("//")) return `https:${candidate}`;
  return undefined;
}
function safeImage(value: unknown): string | undefined {
  return safeHttpsUrl(value);
}

/** Adapter for the documented Renime API JSON contract. */
export class RenimeApiProvider implements AnimeProvider {
  readonly id: string;

  constructor(
    private readonly baseUrl: string,
    private readonly upstreamProvider: "animesalt" | "watchanimeworld",
  ) {
    this.id = `renime-${upstreamProvider}`;
  }

  private async get(path: string): Promise<unknown> {
    const base = this.baseUrl.endsWith("/") ? this.baseUrl : `${this.baseUrl}/`;
    const url = new URL(path, base);
    url.searchParams.set("provider", this.upstreamProvider);
    const response = await fetch(url, {
      headers: { accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!response.ok) throw new Error(`Renime API returned HTTP ${response.status} for ${path}`);
    return response.json();
  }

  async search(options: SearchOptions): Promise<ProviderAnime[]> {
    const payload = unwrap(await this.get(`api/search?q=${encodeURIComponent(options.query)}`));
    return list(payload).map((item) => {
      const row = record(item);
      return {
        id: stringValue(row.id),
        title: stringValue(row.title ?? row.name),
        url: stringValue(row.url),
        image: safeImage(row.image),
        type: (["series", "movie"].includes(stringValue(row.type)) ? stringValue(row.type) : "unknown") as ProviderAnime["type"],
      };
    }).filter((item) => item.id && item.title);
  }

  async home(): Promise<ProviderHome> {
    const payload = record(unwrap(await this.get("api/home")));
    const mapItems = (value: unknown): ProviderAnime[] => list(value).map((item) => {
      const row = record(item);
      return {
        id: stringValue(row.id),
        title: stringValue(row.title ?? row.name),
        image: safeImage(row.image),
        type: (["series", "movie"].includes(stringValue(row.type)) ? stringValue(row.type) : "unknown") as ProviderAnime["type"],
      };
    }).filter((item) => item.id && item.title);
    return {
      newestDrops: mapItems(payload.newestDrops),
      newAnimeArrivals: mapItems(payload.newAnimeArrivals),
      cartoonSeries: mapItems(payload.cartoonSeries),
      animeMovies: mapItems(payload.animeMovies),
      cartoonFilms: mapItems(payload.cartoonFilms),
      mostWatchedShows: mapItems(payload.mostWatchedShows),
      mostWatchedFilms: mapItems(payload.mostWatchedFilms),
    };
  }

  async details(animeId: string): Promise<ProviderDetails> {
    const row = record(unwrap(await this.get(`api/info/${encodeURIComponent(animeId)}`)));
    const seasons = list(row.seasonsList ?? row.seasons)
      .map((season) => Number(season)).filter((season) => Number.isInteger(season) && season > 0);
    const episodes = list(row.episodesList).map((item) => {
      const episode = record(item);
      return {
        id: stringValue(episode.id),
        number: Number(episode.episode),
        season: Number(episode.season) || undefined,
        title: stringValue(episode.title),
        image: safeImage(episode.image),
      };
    }).filter((episode) => episode.id && Number.isFinite(episode.number));
    return {
      id: stringValue(row.id) || animeId,
      title: stringValue(row.title),
      type: (["series", "movie"].includes(stringValue(row.type)) ? stringValue(row.type) : "unknown") as ProviderDetails["type"],
      image: safeImage(row.image),
      background: safeImage(row.background),
      description: stringValue(row.description),
      genres: list(row.genres).map(stringValue).filter(Boolean),
      languages: list(row.languages).map((value) => normalizeAudioLanguage(stringValue(value))).filter((value) => value !== "unknown"),
      year: stringValue(row.year),
      seasons,
      episodes,
    };
  }

  async episodes(options: EpisodeOptions): Promise<ProviderEpisode[]> {
    const season = options.season ?? 1;
    const payload = record(unwrap(await this.get(`api/episodes/${encodeURIComponent(options.animeId)}/${season}`)));
    return list(payload.episodes ?? payload).map((item) => {
      const row = record(item);
      return {
        id: stringValue(row.id),
        number: Number(row.episode),
        season: Number(row.season) || season,
        title: stringValue(row.title),
        image: safeImage(row.image),
      };
    }).filter((item) => item.id && Number.isFinite(item.number));
  }

  async sources(options: SourceOptions): Promise<ProviderSource[]> {
    const payload = record(unwrap(await this.get(`api/embed/${encodeURIComponent(options.episodeId)}`)));
    return list(payload.servers ?? payload).map((item, index) => {
      const row = record(item) as RenimeServer;
      const name = stringValue(row.name) || `Server ${row.server ?? index + 1}`;
      const url = safeHttpsUrl(row.url) ?? "";
      const language: AudioLanguage = normalizeAudioLanguage(name);
      return {
        id: `${this.id}-${row.server ?? index}`,
        url,
        type: "iframe" as const,
        quality: name,
        language,
      };
    }).filter((source) => source.url.startsWith("https://"));
  }
}
