import type { ProviderEpisode, ProviderSource } from "./types";

type JsonRecord = Record<string, unknown>;
function record(value: unknown): JsonRecord { return value && typeof value === "object" ? value as JsonRecord : {}; }
function text(value: unknown): string { return typeof value === "string" || typeof value === "number" ? String(value) : ""; }

/** Optional adapter for a running Anivexa API instance. */
export class AnivexaApiProvider {
  constructor(private readonly baseUrl: string) {}
  private base(): string { return this.baseUrl.endsWith("/") ? this.baseUrl.slice(0, -1) : this.baseUrl; }

  async episodes(anilistId: string): Promise<ProviderEpisode[]> {
    if (!/^\d+$/.test(anilistId)) return [];
    const response = await fetch(`${this.base()}/episodes/${encodeURIComponent(anilistId)}`, {
      headers: { accept: "application/json" }, next: { revalidate: 600 },
    });
    if (!response.ok) throw new Error(`Anivexa API returned HTTP ${response.status}`);
    const payload = record(await response.json());
    const results: ProviderEpisode[] = [];
    for (const [provider, rawProvider] of Object.entries(payload)) {
      if (["page", "type", "mappings", "_sync"].includes(provider)) continue;
      const episodeGroups = record(record(rawProvider).episodes);
      for (const audio of ["sub", "dub"] as const) {
        const list = Array.isArray(episodeGroups[audio]) ? episodeGroups[audio] as unknown[] : [];
        for (const rawEpisode of list) {
          const episode = record(rawEpisode);
          const number = Number(episode.number);
          const id = text(episode.id);
          if (!id || !Number.isFinite(number)) continue;
          results.push({
            id, number, title: text(episode.title), provider, audio,
            image: text(episode.image).startsWith("https://") ? text(episode.image) : undefined,
          });
        }
      }
    }
    return results;
  }

  async watch(provider: string, anilistId: string, audio: "sub" | "dub", episode: number): Promise<ProviderSource[]> {
    if (!/^\d+$/.test(anilistId) || !/^\d+$/.test(String(episode)) || !/^[a-z0-9_-]+$/i.test(provider)) return [];
    const path = `watch/${encodeURIComponent(provider)}/${encodeURIComponent(anilistId)}/${audio}/${encodeURIComponent(provider)}-${episode}`;
    const response = await fetch(`${this.base()}/${path}`, { headers: { accept: "application/json" }, cache: "no-store" });
    if (!response.ok) throw new Error(`Anivexa watch endpoint returned HTTP ${response.status}`);
    const payload = record(await response.json());
    const streams = Array.isArray(payload.streams) ? payload.streams : [];
    return streams.map((raw, index) => {
      const stream = record(raw);
      const type = text(stream.type);
      return {
        id: `${provider}-${episode}-${index}`,
        url: text(stream.url),
        type: type === "embed" ? "iframe" as const : type === "mp4" ? "mp4" as const : "hls" as const,
        quality: text(stream.server) || `Server ${index + 1}`,
        referer: text(stream.referer) || undefined,
      };
    }).filter((source) => source.url.startsWith("https://"));
  }
}
