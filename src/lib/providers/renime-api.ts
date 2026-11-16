import { normalizeAudioLanguage } from "./languages";
import type { AnimeProvider, AudioLanguage, EpisodeOptions, ProviderAnime, ProviderEpisode, ProviderSource, SearchOptions, SourceOptions } from "./types";

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

/**
 * Adapter for a self-hosted Renime-API instance. It consumes its documented
 * JSON endpoints; the API's iframe embeds stay embeds (no stream decryption).
 */
export class RenimeApiProvider implements AnimeProvider {
  readonly id: string;

  constructor(
    private readonly baseUrl: string,
    private readonly upstreamProvider: "animesalt" | "watchanimeworld",
  ) {
    this.id = `renime-${upstreamProvider}`;
  }

  private async get(path: string): Promise<unknown> {
    const url = new URL(path, this.baseUrl.endsWith("/") ? this.baseUrl : `${this.baseUrl}/`);
    url.searchParams.set("provider", this.upstreamProvider);
    const response = await fetch(url, { headers: { accept: "application/json" }, next: { revalidate: 300 } });
    if (!response.ok) throw new Error(`Renime API ${response.status} for ${path}`);
    return response.json();
  }

  async search(options: SearchOptions): Promise<ProviderAnime[]> {
    const query = new URLSearchParams({ q: options.query });
    query.set("provider", this.upstreamProvider);
    const response = await fetch(new URL(`api/search?${query.toString()}`, this.baseUrl.endsWith("/") ? this.baseUrl : `${this.baseUrl}/`), {
      headers: { accept: "application/json" }, next: { revalidate: 300 },
    });
    if (!response.ok) throw new Error(`Renime search failed: ${response.status}`);
    const payload = unwrap(await response.json());
    return list(payload).map((item) => {
      const row = record(item);
      return { id: stringValue(row.id), title: stringValue(row.title ?? row.name), url: stringValue(row.url), languages: this.languages(row.languages) };
    }).filter((item) => item.id && item.title);
  }

  async episodes(options: EpisodeOptions): Promise<ProviderEpisode[]> {
    const season = options.season ?? 1;
    const payload = unwrap(await this.get(`api/episodes/${encodeURIComponent(options.animeId)}/${season}`));
    return list(payload).map((item) => {
      const row = record(item);
      const number = Number(row.episode ?? row.number ?? row.episodeNumber);
      return { id: stringValue(row.id ?? row.url), number, title: stringValue(row.title), url: stringValue(row.url), languages: this.languages(row.languages) };
    }).filter((item) => item.id && Number.isFinite(item.number));
  }

  async sources(options: SourceOptions): Promise<ProviderSource[]> {
    const payload = unwrap(await this.get(`api/embed/${encodeURIComponent(options.episodeId)}`));
    return list(payload).map((item, index) => {
      const row = record(item) as RenimeServer;
      const name = stringValue(row.name) || `Server ${row.server ?? index + 1}`;
      const language: AudioLanguage = normalizeAudioLanguage(name);
      return { id: `${this.id}-${row.server ?? index}`, url: stringValue(row.url), type: "iframe" as const, quality: name, language };
    }).filter((source) => source.url.startsWith("https://"));
  }

  private languages(value: unknown): AudioLanguage[] {
    return list(value).map((language) => normalizeAudioLanguage(stringValue(language))).filter((language) => language !== "unknown");
  }
}
