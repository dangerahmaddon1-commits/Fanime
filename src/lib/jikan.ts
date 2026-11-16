export type JikanAnime = {
  mal_id: number;
  title: string;
  title_english?: string | null;
  title_japanese?: string | null;
  synopsis?: string | null;
  episodes?: number | null;
  year?: number | null;
  type?: string | null;
  status?: string | null;
  score?: number | null;
  genres?: Array<{ name: string }>;
  images?: { webp?: { image_url?: string }; jpg?: { image_url?: string } };
  trailer?: { images?: { maximum_image_url?: string; large_image_url?: string } };
};

const JIKAN_BASE = "https://api.jikan.moe/v4";

async function jikanGet<T>(path: string, revalidate = 86400): Promise<T> {
  const response = await fetch(`${JIKAN_BASE}/${path}`, {
    headers: { accept: "application/json" },
    next: { revalidate },
  });
  if (!response.ok) throw new Error(`Jikan returned HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

export async function searchJikanAnime(query: string, limit = 24): Promise<JikanAnime[]> {
  const q = query.trim();
  if (!q) return [];
  const params = new URLSearchParams({ q, limit: String(Math.min(Math.max(limit, 1), 25)), sfw: "true" });
  const payload = await jikanGet<{ data?: JikanAnime[] }>(`anime?${params.toString()}`);
  return payload.data ?? [];
}

export async function getJikanAnime(malId: string | number): Promise<JikanAnime | null> {
  const id = String(malId);
  if (!/^\\d+$/.test(id)) return null;
  const payload = await jikanGet<{ data?: JikanAnime }>(`anime/${id}/full`);
  return payload.data ?? null;
}

export async function getJikanTopAnime(limit = 12): Promise<JikanAnime[]> {
  const params = new URLSearchParams({ limit: String(Math.min(Math.max(limit, 1), 25)), filter: "bypopularity" });
  const payload = await jikanGet<{ data?: JikanAnime[] }>(`top/anime?${params.toString()}`);
  return payload.data ?? [];
}

export function jikanImage(anime: JikanAnime): string | undefined {
  return anime.images?.webp?.image_url || anime.images?.jpg?.image_url;
}

export function jikanTitle(anime: JikanAnime): string {
  return anime.title_english || anime.title || anime.title_japanese || "Untitled anime";
}
