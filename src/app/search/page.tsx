import Link from "next/link";
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

async function searchAnime(query: string): Promise<{ items: SearchItem[]; source: string; notice?: string }> {
  const baseUrl = process.env.RENIME_API_BASE_URL?.trim();
  const providerKey = process.env.RENIME_DEFAULT_PROVIDER === "watchanimeworld" ? "watchanimeworld" : "animesalt";

  if (query && baseUrl) {
    try {
      for (const provider of getRenimeProviderOrder(baseUrl)) {
        try {
          const results = await provider.search({ query });
          if (results.length) {
            return {
              source: provider.id === "renime-animesalt" ? "AnimeSalt" : "WatchAnimeWorld",
              items: results.map((item) => ({ id: item.id, title: item.title, image: item.image, type: item.type })),
            };
          }
        } catch {
          // Try the next configured upstream provider.
        }
      }
    } catch {
      // Keep discovery usable when the optional third-party API is offline.
    }
  }

  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      query: query
        ? `query ($search: String!) { Page(page: 1, perPage: 24) { media(search: $search, type: ANIME, isAdult: false, sort: [SEARCH_MATCH]) { id title { romaji english native } coverImage { large } episodes seasonYear format averageScore } } }`
        : `query { Page(page: 1, perPage: 24) { media(type: ANIME, isAdult: false, sort: [TRENDING_DESC, POPULARITY_DESC]) { id title { romaji english native } coverImage { large } episodes seasonYear format averageScore } } }`,
      variables: query ? { search: query } : {},
    }),
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error("Anime catalog is temporarily unavailable.");
  const json = await response.json();
  const items: AniListAnime[] = json.data?.Page?.media ?? [];
  return {
    source: "AniList",
    notice: baseUrl && query ? "The selected provider could not be reached, so these results are from the general anime catalog." : undefined,
    items: items.map((anime) => ({
      id: String(anime.id),
      title: anime.title.english || anime.title.romaji || anime.title.native || "Untitled anime",
      image: anime.coverImage.large,
      meta: [anime.seasonYear, anime.format, anime.episodes ? `${anime.episodes} eps` : null].filter(Boolean).join(" · "),
    })),
  };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  let items: SearchItem[] = [];
  let source = "AniList";
  let notice = "";
  let error = "";
  try {
    const result = await searchAnime(q.trim());
    items = result.items;
    source = result.source;
    notice = result.notice ?? "";
  } catch {
    error = "The anime catalog could not be reached. Please try again shortly.";
  }

  return <main className="min-h-screen">
    <header className="border-b border-white/10"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5"><Link href="/" className="text-xl font-black tracking-tight">F <span className="text-[var(--accent)]">ANIME</span></Link><nav className="flex gap-5 text-sm text-neutral-300"><Link href="/search" className="text-white">Discover</Link><Link href="/schedule">Schedule</Link></nav></div></header>
    <section className="mx-auto max-w-7xl px-5 py-12">
      <p className="text-xs font-bold tracking-[.25em] text-[var(--accent)]">F ANIME DISCOVERY</p><h1 className="mt-3 text-4xl font-black">Find your next anime.</h1>
      <form action="/search" className="mt-8 flex max-w-2xl gap-2"><input name="q" defaultValue={q} placeholder="Search anime titles..." className="min-w-0 flex-1 rounded-xl border border-white/15 bg-[#1d1d1d] px-4 py-3 outline-none focus:border-[var(--accent)]" /><button className="rounded-xl bg-[var(--accent)] px-6 py-3 font-bold text-black">Search</button></form>
      <div className="mt-10 flex items-center justify-between gap-4"><h2 className="text-xl font-bold">{q ? `Results for “${q}”` : "Trending anime"}</h2><span className="text-xs text-neutral-500">Source: {source} · {items.length} titles</span></div>
      {notice && <p className="mt-5 rounded-xl border border-amber-500/20 bg-amber-950/20 p-3 text-sm text-amber-100">{notice}</p>}
      {error && <p className="mt-8 rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-red-200">{error}</p>}
      {items.length === 0 && !error && <p className="mt-8 text-neutral-400">{q ? "No matching anime found. Try another title." : "No titles are available right now."}</p>}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">{items.map((anime) => <Link key={anime.id} href={`/anime/${encodeURIComponent(anime.id)}`} className="group overflow-hidden rounded-xl border border-white/10 bg-[#1b1b1b] transition hover:-translate-y-1 hover:border-[var(--accent)]/60"><div className="aspect-[3/4] overflow-hidden bg-[#252525]">{anime.image ? <img src={anime.image} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" /> : <div className="flex h-full items-center justify-center text-sm text-neutral-600">F Anime</div>}</div><div className="p-3"><h3 className="line-clamp-2 text-sm font-bold">{anime.title}</h3><p className="mt-2 text-xs text-neutral-500">{anime.meta || anime.type || "Anime"}</p></div></Link>)}</div>
    </section>
  </main>;
}
