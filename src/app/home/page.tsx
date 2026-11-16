import Link from "next/link";

export const metadata: Metadata = {
  title: "Anime Catalog & Trending Anime",
  description: "Browse trending anime, latest episodes, new arrivals and anime movies on F Anime.",
  alternates: { canonical: "/home" },
};
import type { Metadata } from "next";
import { getRenimeProviderOrder } from "@/lib/providers/provider-order";
import type { ProviderAnime, ProviderHome } from "@/lib/providers/types";
import { getJikanTopAnime, jikanImage, jikanTitle } from "@/lib/jikan";

export const dynamic = "force-dynamic";

const languageOptions = ["Japanese", "English", "Hindi", "Tamil", "Telugu", "Korean", "Chinese"];
type CatalogCard = { id: string; title: string; image?: string; meta?: string };
type TrendingAnime = { id: number; title: { romaji?: string; english?: string }; coverImage: { large: string }; averageScore?: number };
type AiringPreview = { id: number; airingAt: number; episode: number; media: { id: number; title: { romaji?: string; english?: string }; coverImage: { large: string } } };

async function getProviderHome(): Promise<ProviderHome | null> {
  const baseUrl = process.env.RENIME_API_BASE_URL?.trim();
  if (!baseUrl) return null;
  for (const provider of getRenimeProviderOrder(baseUrl)) {
    try {
      const data = await provider.home();
      if (data.newestDrops.length || data.newAnimeArrivals.length || data.mostWatchedShows.length) return data;
    } catch {
      // Try the alternate catalog.
    }
  }
  return null;
}

async function getTrending(): Promise<CatalogCard[]> {
  try {
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: `query { Page(page: 1, perPage: 12) { media(type: ANIME, isAdult: false, sort: [TRENDING_DESC]) { id title { romaji english } coverImage { large } averageScore } } }` }),
      next: { revalidate: 900 },
    });
    if (response.ok) {
      const json = await response.json();
      const items: TrendingAnime[] = json.data?.Page?.media ?? [];
      if (items.length) {
        return items.map((anime) => ({ id: String(anime.id), title: anime.title.english || anime.title.romaji || "Anime", image: anime.coverImage.large, meta: anime.averageScore ? `★ ${anime.averageScore}%` : "Trending" }));
      }
    }
  } catch {
    // Use Jikan if AniList is temporarily unavailable.
  }
  try {
    const items = await getJikanTopAnime(12);
    return items.map((anime) => ({
      id: `mal-${anime.mal_id}`,
      title: jikanTitle(anime),
      image: jikanImage(anime),
      meta: anime.score ? `★ ${anime.score.toFixed(1)} · MAL` : "Popular on MyAnimeList",
    }));
  } catch {
    return [];
  }
}

async function getSchedulePreview(): Promise<AiringPreview[]> {
  const now = Math.floor(Date.now() / 1000);
  try {
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: `query ($start: Int!, $end: Int!) { Page(page: 1, perPage: 8) { airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) { id airingAt episode media { id title { romaji english } coverImage { large } } } } }`, variables: { start: now, end: now + 24 * 60 * 60 } }),
      next: { revalidate: 300 },
    });
    if (!response.ok) return [];
    const json = await response.json();
    return json.data?.Page?.airingSchedules ?? [];
  } catch { return []; }
}

function mapProviderItems(items: ProviderAnime[]): CatalogCard[] {
  return items.map((item) => ({ id: item.id, title: item.title, image: item.image }));
}

function Shelf({ title, eyebrow, items }: { title: string; eyebrow: string; items: CatalogCard[] }) {
  if (!items.length) return null;
  return <section className="mt-10">
    <div className="mb-4 flex items-end justify-between"><div><p className="text-[10px] font-bold tracking-[.24em] text-[var(--accent)]">{eyebrow}</p><h2 className="mt-1 text-xl font-bold">{title}</h2></div><Link href="/search" className="text-xs font-semibold text-[var(--accent)] hover:underline">View all →</Link></div>
    <div className="flex gap-3 overflow-x-auto pb-3">{items.slice(0, 12).map((item) => <Link key={item.id} href={`/anime/${encodeURIComponent(item.id)}?title=${encodeURIComponent(item.title)}`} className="group w-36 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#1b1b1b] transition hover:border-[var(--accent)]/60 sm:w-40"><div className="aspect-[3/4] overflow-hidden bg-[#252525]">{item.image ? <img src={item.image} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" /> : <div className="flex h-full items-center justify-center text-xs text-neutral-600">F Anime</div>}</div><div className="p-3"><h3 className="line-clamp-2 text-xs font-bold">{item.title}</h3>{item.meta && <p className="mt-1 text-[10px] text-neutral-500">{item.meta}</p>}</div></Link>)}</div>
  </section>;
}

export default async function HomePage() {
  const [providerHome, fallbackTrending, schedule] = await Promise.all([getProviderHome(), getTrending(), getSchedulePreview()]);
  const newestDrops = mapProviderItems(providerHome?.newestDrops ?? []);
  const newArrivals = mapProviderItems(providerHome?.newAnimeArrivals ?? []);
  const popular = providerHome?.mostWatchedShows.length ? mapProviderItems(providerHome.mostWatchedShows) : fallbackTrending;
  const animeMovies = mapProviderItems(providerHome?.animeMovies ?? []);
  const featured = popular[0];

  return <main className="min-h-screen bg-[#101010]">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[76px] flex-col items-center border-r border-white/10 bg-[#121212] py-6 lg:flex">
      <Link href="/" className="text-xl font-black text-white">F<span className="text-[var(--accent)]">.</span></Link>
      <div className="mt-12 flex flex-col gap-3">
        <Link href="/home" title="Home" className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)]/15 text-lg text-[var(--accent)]">⌂</Link>
        <Link href="/search" title="Discover" className="flex h-11 w-11 items-center justify-center rounded-xl text-lg text-neutral-400 transition hover:bg-white/5 hover:text-white">⌕</Link>
        <Link href="/schedule" title="Schedule" className="flex h-11 w-11 items-center justify-center rounded-xl text-lg text-neutral-400 transition hover:bg-white/5 hover:text-white">▦</Link>
      </div>
      <div className="mt-auto text-[10px] font-bold tracking-widest text-neutral-600">F ANIME</div>
    </aside>

    <div className="min-w-0 lg:pl-[76px]">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#101010]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-3 sm:px-7">
          <Link href="/" className="shrink-0 text-lg font-black lg:hidden">F <span className="text-[var(--accent)]">ANIME</span></Link>
          <form action="/search" className="ml-auto flex w-full max-w-xl items-center gap-2 rounded-xl border border-white/10 bg-[#1b1b1b] px-3 py-2">
            <span className="text-neutral-500">⌕</span><input name="q" placeholder="Search anime..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-600" /><kbd className="hidden rounded border border-white/10 px-2 py-1 text-[10px] text-neutral-500 sm:block">ENTER</kbd>
          </form>
          <div className="hidden shrink-0 text-xs font-semibold text-neutral-400 sm:block">YOUR ANIME UNIVERSE</div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-8 px-4 py-7 sm:px-7 xl:grid-cols-[minmax(0,1fr)_310px]">
        <div className="min-w-0">
          <section className="relative isolate flex min-h-[320px] items-end overflow-hidden rounded-2xl border border-white/10 bg-[#1b1b1b] p-6 sm:min-h-[390px] sm:p-9">
            {featured?.image && <div className="absolute inset-0 -z-20 bg-cover bg-center opacity-35" style={{ backgroundImage: `url(${featured.image})` }} />}
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#101010] via-[#101010]/85 to-[#101010]/20" />
            <div className="max-w-2xl">
              <p className="text-[10px] font-bold tracking-[.3em] text-[var(--accent)]">FEATURED · F ANIME</p>
              <h1 className="mt-4 text-4xl font-black leading-tight sm:text-6xl">{featured?.title || "Discover your next anime"}</h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-300">Explore the latest episodes, find your next series, and discover anime across the languages you enjoy.</p>
              <div className="mt-7 flex flex-wrap gap-3"><Link href={featured ? `/anime/${encodeURIComponent(featured.id)}?title=${encodeURIComponent(featured.title)}` : "/search"} className="rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-bold text-black transition hover:brightness-110">Explore title →</Link><Link href="/schedule" className="rounded-lg border border-white/20 bg-black/20 px-5 py-3 text-sm font-semibold text-white hover:border-white/40">View schedule</Link></div>
            </div>
            <div className="absolute bottom-5 right-6 hidden gap-2 sm:flex"><span className="h-1.5 w-7 rounded-full bg-[var(--accent)]" /><span className="h-1.5 w-3 rounded-full bg-white/40" /><span className="h-1.5 w-3 rounded-full bg-white/40" /></div>
          </section>

          <Shelf eyebrow="LATEST EPISODES" title="Latest episodes" items={newestDrops} />
          <Shelf eyebrow="JUST ADDED" title="New on site" items={newArrivals} />
          <Shelf eyebrow="POPULAR RIGHT NOW" title="Trending anime" items={popular} />
          <Shelf eyebrow="FEATURED FILMS" title="Anime movies" items={animeMovies} />

          <section className="mt-10 rounded-2xl border border-white/10 bg-[#181818] p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-bold tracking-[.24em] text-[var(--accent)]">MORE WAYS TO WATCH</p><h2 className="mt-1 text-xl font-bold">Choose your language</h2></div><span className="text-xs text-neutral-500">Availability varies by anime and episode</span></div>
            <div className="mt-5 flex flex-wrap gap-2">{languageOptions.map((language) => <span key={language} className="rounded-full border border-white/10 bg-white/[.04] px-3 py-2 text-xs text-neutral-300">{language}</span>)}</div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-[#181818] p-5">
            <div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-bold tracking-[.24em] text-[var(--accent)]">RANKINGS</p><h2 className="mt-1 text-lg font-bold">Top trending</h2></div><span className="text-xs text-neutral-500">Today</span></div>
            <div className="space-y-3">{popular.slice(0, 6).map((item, index) => <Link key={item.id} href={`/anime/${encodeURIComponent(item.id)}?title=${encodeURIComponent(item.title)}`} className="flex items-center gap-3"><span className="w-5 text-sm font-black text-neutral-600">{String(index + 1).padStart(2, "0")}</span>{item.image ? <img src={item.image} alt="" className="h-14 w-10 rounded-md object-cover" loading="lazy" /> : <div className="h-14 w-10 rounded-md bg-white/5" />}<span className="line-clamp-2 text-xs font-semibold text-neutral-200 transition hover:text-[var(--accent)]">{item.title}</span></Link>)}</div>
          </section>
          <section className="rounded-2xl border border-white/10 bg-[#181818] p-5">
            <div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-bold tracking-[.24em] text-[var(--accent)]">AIRING TODAY</p><h2 className="mt-1 text-lg font-bold">Schedule preview</h2></div><Link href="/schedule" className="text-xs font-semibold text-[var(--accent)]">Full week →</Link></div>
            {schedule.length ? <div className="space-y-3">{schedule.slice(0, 6).map((item) => <Link key={item.id} href={`/anime/${item.media.id}`} className="flex items-center gap-3"><img src={item.media.coverImage.large} alt="" className="h-12 w-9 rounded object-cover" loading="lazy" /><div className="min-w-0 flex-1"><p className="line-clamp-1 text-xs font-semibold">{item.media.title.english || item.media.title.romaji}</p><p className="mt-1 text-[10px] text-neutral-500">Episode {item.episode}</p></div><span className="text-[10px] font-semibold text-[var(--accent)]">{new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit" }).format(new Date(item.airingAt * 1000))}</span></Link>)}</div> : <p className="text-sm text-neutral-500">Today&apos;s airing preview is temporarily unavailable.</p>}
          </section>
          <section className="rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/[.04] p-5">
            <p className="text-xs font-bold tracking-[.2em] text-[var(--accent)]">F ANIME</p><h2 className="mt-2 text-lg font-bold">Your anime universe.</h2><p className="mt-2 text-xs leading-6 text-neutral-400">Discover series, follow airing times and explore language options in one place.</p><Link href="/search" className="mt-4 inline-block text-xs font-bold text-[var(--accent)]">Start exploring →</Link>
          </section>
        </aside>
      </div>
    </div>
  </main>;
}
