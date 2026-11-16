import { load } from "cheerio";
import { normalizeAudioLanguage } from "./languages";
import type { AnimeProvider, EpisodeOptions, ProviderAnime, ProviderDetails, ProviderEpisode, ProviderHome, ProviderSource, SearchOptions, SourceOptions } from "./types";

const PROVIDERS = {
  animesalt: { id: "animesalt", name: "AnimeSalt", baseUrl: "https://animesalt.link" },
  watchanimeworld: { id: "watchanimeworld", name: "WatchAnimeWorld", baseUrl: "https://watchanimeworld.top" },
} as const;

type ProviderKey = keyof typeof PROVIDERS;
type CheerioApi = ReturnType<typeof load>;

function absoluteHttps(value: string | undefined, baseUrl: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value, baseUrl);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function lastPathSegment(value: string): string {
  try {
    const parts = new URL(value).pathname.split("/").filter(Boolean);
    return parts.at(-1) ?? "";
  } catch {
    return "";
  }
}

function parseEpisodeNumber(value: string): { season?: number; episode: number } | null {
  const match = value.match(/(\d+)[xX](\d+)/) ?? value.match(/[sS](\d+)[eE](\d+)/);
  if (!match) return null;
  return { season: Number(match[1]), episode: Number(match[2]) };
}

/**
 * Direct Cloudflare-compatible adapter based on the supplied Renime-API
 * extractor selectors. It uses ordinary HTTPS fetch and returns only catalog
 * data and provider-supplied iframe URLs; it does not decrypt media streams.
 */
export class DirectRenimeProvider implements AnimeProvider {
  readonly id: string;
  private readonly baseUrl: string;
  private readonly name: string;

  constructor(providerKey: ProviderKey) {
    const provider = PROVIDERS[providerKey];
    this.id = `direct-${provider.id}`;
    this.baseUrl = provider.baseUrl;
    this.name = provider.name;
  }

  private async request(path: string, options: { method?: "GET" | "POST"; body?: string; referer?: string } = {}): Promise<string> {
    const url = new URL(path, this.baseUrl);
    const headers = new Headers({
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
      "Accept": options.method === "POST" ? "*/*" : "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    });
    if (options.referer) {
      headers.set("Referer", options.referer);
      headers.set("X-Requested-With", "XMLHttpRequest");
    }
    if (options.method === "POST") {
      headers.set("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
      headers.set("Origin", this.baseUrl);
      headers.set("X-Requested-With", "XMLHttpRequest");
    }
    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body: options.body,
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`${this.name} returned HTTP ${response.status}`);
    return response.text();
  }

  private parseEpisode($: CheerioApi, item: unknown): ProviderEpisode | null {
    const element = $(item as never);
    const label = element.find(".num-epi").first().text().trim();
    const parsed = parseEpisodeNumber(label);
    const link = element.find("a.lnk-blk").first().attr("href") ?? "";
    const id = absoluteHttps(link, this.baseUrl) ? lastPathSegment(new URL(link, this.baseUrl).toString()) : "";
    if (!id || !parsed) return null;
    return {
      id,
      season: parsed.season,
      number: parsed.episode,
      title: element.find(".entry-title").first().text().trim() || undefined,
      image: absoluteHttps(element.find("img").first().attr("src"), this.baseUrl),
    };
  }

  private async fetchDetailsPage(id: string): Promise<{ html: string; url: string }> {
    let lastError: unknown;
    for (const path of [`/series/${encodeURIComponent(id)}/`, `/movies/${encodeURIComponent(id)}/`]) {
      try {
        return { html: await this.request(path), url: new URL(path, this.baseUrl).toString() };
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error ? lastError : new Error(`Could not load ${id} from ${this.name}`);
  }

  async search(options: SearchOptions): Promise<ProviderAnime[]> {
    const html = await this.request(`/?s=${encodeURIComponent(options.query)}`);
    const $ = load(html);
    const results: ProviderAnime[] = [];
    $(".post-lst li").each((_, element) => {
      const item = $(element);
      const title = item.find(".entry-title").first().text().trim();
      const link = item.find("a.lnk-blk").first().attr("href") ?? "";
      const absolute = absoluteHttps(link, this.baseUrl);
      if (!title || !absolute) return;
      const path = new URL(absolute).pathname;
      results.push({
        id: lastPathSegment(absolute),
        title,
        url: absolute,
        image: absoluteHttps(item.find("img").first().attr("src"), this.baseUrl),
        type: path.includes("/series/") ? "series" : path.includes("/movie") ? "movie" : "unknown",
      });
    });
    return results.filter((item) => item.id);
  }

  async home(): Promise<ProviderHome> {
    return { newestDrops: [], newAnimeArrivals: [], cartoonSeries: [], animeMovies: [], cartoonFilms: [], mostWatchedShows: [], mostWatchedFilms: [] };
  }

  async details(animeId: string): Promise<ProviderDetails> {
    const { html, url } = await this.fetchDetailsPage(animeId);
    const $ = load(html);
    const bodyClass = $("body").attr("class") ?? "";
    const postId = bodyClass.match(/postid-(\d+)/)?.[1];
    const seasons = new Set<number>();
    $(".aa-cnt.sub-menu a[data-season], .choose-season .sub-menu a[data-season], li.sel-temp a[data-season]").each((_, element) => {
      const season = Number($(element).attr("data-season"));
      if (Number.isInteger(season) && season > 0) seasons.add(season);
    });
    if (!seasons.size) {
      const currentSeason = Number($(".aa-drp.choose-season dt.n_s").first().text().trim());
      if (Number.isInteger(currentSeason) && currentSeason > 0) seasons.add(currentSeason);
    }
    const episodes: ProviderEpisode[] = [];
    $("#episode_by_temp li").each((_, element) => {
      const episode = this.parseEpisode($, element);
      if (episode) episodes.push(episode);
    });
    const type = url.includes("/series/") ? "series" : url.includes("/movie") ? "movie" : "unknown";
    const image = absoluteHttps($("article.post.single img").first().attr("src"), this.baseUrl);
    const backgroundRaw = $(".bghd img.TPostBg").first().attr("src") || $(".bgft img.TPostBg").first().attr("src");
    const background = absoluteHttps(backgroundRaw, this.baseUrl);
    const genres = $(".genres a").map((_, element) => $(element).text().trim()).get().filter(Boolean);
    const languages = $(".loadactor a").map((_, element) => normalizeAudioLanguage($(element).text().trim())).get().filter((value) => value !== "unknown");
    const title = $("h1.entry-title").first().text().trim();
    return {
      id: animeId,
      title,
      type,
      image,
      background,
      description: $(".description").first().text().trim(),
      genres,
      languages,
      year: $(".year .overviewCss").first().text().trim(),
      seasons: [...seasons].sort((a, b) => a - b),
      episodes,
      postId,
    };
  }

  async episodes(options: EpisodeOptions): Promise<ProviderEpisode[]> {
    const details = await this.details(options.animeId);
    if (!details.postId) return details.episodes.filter((item) => !options.season || item.season === options.season);
    const season = options.season ?? 1;
    const path = `/wp-admin/admin-ajax.php?action=action_select_season&season=${season}&post=${encodeURIComponent(details.postId)}`;
    const referer = new URL(`/series/${encodeURIComponent(options.animeId)}/`, this.baseUrl).toString();
    const html = await this.request(path, { referer });
    const $ = load(html);
    const results: ProviderEpisode[] = [];
    $("li").each((_, element) => {
      const episode = this.parseEpisode($, element);
      if (episode) results.push({ ...episode, season });
    });
    return results;
  }

  async sources(options: SourceOptions): Promise<ProviderSource[]> {
    let html = "";
    try {
      html = await this.request(`/episode/${encodeURIComponent(options.episodeId)}/`);
    } catch {
      const seriesId = options.episodeId.replace(/-\d+x\d+$/i, "");
      const details = await this.fetchDetailsPage(seriesId || options.episodeId);
      html = details.html;
    }
    const $ = load(html);
    const sources: ProviderSource[] = [];
    $('div[id^="options-"]').each((_, element) => {
      const option = $(element);
      const optionId = option.attr("id") ?? "";
      const serverNumber = Number(optionId.match(/options-(\d+)/)?.[1]);
      if (!Number.isInteger(serverNumber)) return;
      const iframe = option.find("iframe").first();
      const rawUrl = iframe.attr("src") || iframe.attr("data-src") || "";
      const url = absoluteHttps(rawUrl, this.baseUrl);
      const name = $(`a[href="#${optionId}"] .server`).first().text().trim() || `Server ${serverNumber}`;
      if (!url || name.toLowerCase().includes("play") || url.includes("play.zephyrflick.top")) return;
      sources.push({ id: `${this.id}-${serverNumber}`, url, type: "iframe", quality: name });
    });
    return sources.sort((a, b) => Number(a.id.split("-").at(-1)) - Number(b.id.split("-").at(-1)));
  }
}
