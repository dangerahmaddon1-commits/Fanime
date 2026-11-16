import Link from "next/link";

export const metadata: Metadata = {
  title: "Discover and Search Anime",
  description: "Search anime by title, genre, year, season, format and airing status.",
  alternates: { canonical: "/search" },
};
import type { Metadata } from "next";
import { getRenimeProviderOrder } from "@/lib/providers/provider-order";

type AniListAnime = {
  id: number;
  title: { romaji?: string; english?: string; native?: string };
  coverImage: { large: string };
  episodes?: number;
  seasonYear?: number;
  format?: string;
  averageScore?: number;
};
type SearchItem = { id: string; title: string; image?: string; type?: string; meta?: string };
type Filters = { q: string; genre: string; year: string; season: string; format: string; status: string; sort: string };

const allowedSorts = ["TRENDING_DESC", "POPULARITY_DESC", "SCORE_DESC", "START_DATE_DESC"];
const sortValue = (value: string) => allowedSorts.includes(value) ? value : "TRENDING_DESC";

async function searchAnime(filters: Filters): Promise<{ items: SearchItem[]; source: string; notice?: string }> {
  const baseUrl = process.env.RENIME_API_BASE_URL?.trim();
  const hasFilters = Boolean(filters.genre || filters.year || filters.season || filters.format || filters.status);
  if (filters.q && !hasFilters) {
    for (const provider of getRenimeProviderOrder(baseUrl)) {
      try {
        const results = await provider.search({ query: filters.q });
        if (results.length) {
          return {
            source: provider.id.includes("animesalt") ? "AnimeSalt" : "WatchAnimeWorld",
            items: results.map((item) => ({ id: item.id, title: item.title, image: item.image, type: item.type })),
          };
        }
      } catch {
        // Try the alternate provider before falling back to AniList.
      }
    }
  }

  const variables: Record<string, string | number | string[]> = { sort: [sortValue(filters.sort)] };
  if (filters.q) variables.search = filters.q;
  if (filters.genre) variables.genre = filters.genre;
  if (filters.year && /^\d{4}$/.test(filters.year)) variables.seasonYear = Number(filters.year);
  if (["WINTER", "SPRING", "SUMMER", "FALL"].includes(filters.season)) variables.season = filters.season;
  if (["TV", "TV_SHORT", "MOVIE", "OVA", "ONA", "SPECIAL"].includes(filters.format)) variables.format = filters.format;
  if (["RELEASING", "FINISHED", "NOT_YET_RELEASED"].includes(filters.status)) variables.status = filters.status;

  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      query: `query ($search: String, $genre: String, $seasonYear: Int, $season: MediaSeason, $format: MediaFormat, $status: MediaStatus, $sort: [MediaSort]) { Page(page: 1, perPage: 30) { media(search: $search, genre: $genre, seasonYear: $seasonYear, season: $season, format: $format, status: $status, type: ANIME, isAdult: false, sort: $sort) { id title { romaji english native } coverImage { large } episodes seasonYear format averageScore } } }`,
      variables,
    }),
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error("Anime catalog is temporarily unavailable.");
  const json = await response.json();
  const items: AniListAnime[] = json.data?.Page?.media ?? [];
  return {
    source: "AniList",
    notice: baseUrl && filters.q && !hasFilters ? "The selected provider could not be reached, so these results are from the general anime catalog." : undefined,
    items: items.map((anime) => ({
      id: String(anime.id),
      title: anime.title.english || anime.title.romaji || anime.title.native || "Untitled anime",
      image: anime.coverImage.large,
      meta: [anime.seasonYear, anime.format, anime.episodes ? `${anime.episodes} eps` : null].filter(Boolean).join(" · "),
    })),
  };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; genre?: string; year?: string; season?: string; format?: string; status?: string; sort?: string }> }) {
  const params = await searchParams;
  const filters: Filters = {
    q: params.q?.trim() ?? "",
    genre: params.genre ?? "",
    year: params.year ?? "",
    season: params.season ?? "",
    format: params.format ?? "",
    status: params.status ?? "",
    sort: params.sort ?? "TRENDING_DESC",
  };
  let items: SearchItem[] = [];
  let source = "AniList";
  let notice = "";
  let error = "";
  try {
    const result = await searchAnime(filters);
    items = result.items;
    source = result.source;
    notice = result.notice ?? "";
  } catch {
    error = "The anime catalog could not be reached. Please try again shortly.";
  }

  return <main className="min-h-screen bg-[#101010]">
    <header className="border-b border-white/10"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5"><Link href="/home" className="text-xl font-black tracking-tight">F <span className="text-[var(--accent)]">ANIME</span></Link><nav className="flex gap-5 text-sm text-neutral-300"><Link href="/search" className="text-white">Discover</Link><Link href="/schedule">Schedule</Link></nav></div></header>
    <section className="mx-auto max-w-7xl px-5 py-10">
      <p className="text-xs font-bold tracking-[.25em] text-[var(--accent)]">F ANIME DISCOVERY</p><h1 className="mt-3 text-4xl font-black">Find your next anime.</h1>
      <form action="/search" className="mt-8 grid gap-3 rounded-2xl border border-white/10 bg-[#181818] p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input name="q" defaultValue={filters.q} placeholder="Search anime titles..." className="rounded-lg border border-white/10 bg-[#101010] px-3 py-3 text-sm outline-none focus:border-[var(--accent)] sm:col-span-2" />
        <select name="genre" defaultValue={filters.genre} className="rounded-lg border border-white/10 bg-[#101010] px-3 py-3 text-sm text-neutral-300"><option value="">All genres</option>{["Action","Adventure","Comedy","Drama","Fantasy","Horror","Mahou Shoujo","Mecha","Music","Mystery","Psychological","Romance","Sci-Fi","Slice of Life","Sports","Supernatural","Thriller"].map((item)=><option key={item} value={item}>{item}</option>)}</select>
        <select name="year" defaultValue={filters.year} className="rounded-lg border border-white/10 bg-[#101010] px-3 py-3 text-sm text-neutral-300"><option value="">Any year</option>{Array.from({length: 30},(_,i)=>String(new Date().getFullYear()-i)).map((year)=><option key={year} value={year}>{year}</option>)}</select>
        <select name="season" defaultValue={filters.season} className="rounded-lg border border-white/10 bg-[#101010] px-3 py-3 text-sm text-neutral-300"><option value="">Any season</option><option value="WINTER">Winter</option><option value="SPRING">Spring</option><option value="SUMMER">Summer</option><option value="FALL">Fall</option></select>
        <select name="format" defaultValue={filters.format} className="rounded-lg border border-white/10 bg-[#101010] px-3 py-3 text-sm text-neutral-300"><option value="">Any format</option><option value="TV">TV</option><option value="TV_SHORT">TV short</option><option value="MOVIE">Movie</option><option value="OVA">OVA</option><option value="ONA">ONA</option><option value="SPECIAL">Special</option></select>
        <select name="status" defaultValue={filters.status} className="rounded-lg border border-white/10 bg-[#101010] px-3 py-3 text-sm text-neutral-300"><option value="">Any status</option><option value="RELEASING">Airing</option><option value="FINISHED">Finished</option><option value="NOT_YET_RELEASED">Upcoming</option></select>
        <select name="sort" defaultValue={sortValue(filters.sort)} className="rounded-lg border border-white/10 bg-[#101010] px-3 py-3 text-sm text-neutral-300"><option value="TRENDING_DESC">Trending</option><option value="POPULARITY_DESC">Popularity</option><option value="SCORE_DESC">Score</option><option value="START_DATE_DESC">Newest</option></select>
        <button className="rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-bold text-black transition hover:brightness-110">Apply filters</button>
      </form>
      <div className="mt-10 flex items-center justify-between gap-4"><h2 className="text-xl font-bold">{filters.q ? `Results for “${filters.q}”` : "Explore anime"}</h2><span className="text-xs text-neutral-500">Source: {source} · {items.length} titles</span></div>
      {notice && <p className="mt-5 rounded-xl border border-amber-500/20 bg-amber-950/20 p-3 text-sm text-amber-100">{notice}</p>}
      {error && <p className="mt-8 rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-red-200">{error}</p>}
      {items.length === 0 && !error && <p className="mt-8 text-neutral-400">No matching anime found. Try adjusting your filters.</p>}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">{items.map((anime) => <Link key={anime.id} href={`/anime/${encodeURIComponent(anime.id)}?title=${encodeURIComponent(anime.title)}`} className="group overflow-hidden rounded-xl border border-white/10 bg-[#1b1b1b] transition hover:-translate-y-1 hover:border-[var(--accent)]/60"><div className="aspect-[3/4] overflow-hidden bg-[#252525]">{anime.image ? <img src={anime.image} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" /> : <div className="flex h-full items-center justify-center text-sm text-neutral-600">F Anime</div>}</div><div className="p-3"><h3 className="line-clamp-2 text-sm font-bold">{anime.title}</h3><p className="mt-2 text-xs text-neutral-500">{anime.meta || anime.type || "Anime"}</p></div></Link>)}</div>
    </section>
  </main>;
}
