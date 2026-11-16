import Link from "next/link";
import { getRenimeProviderOrder } from "@/lib/providers/provider-order";
import type { ProviderAnime, ProviderHome } from "@/lib/providers/types";

const languageOptions = ["Japanese", "English", "Hindi", "Tamil", "Telugu", "Korean", "Chinese"];
type CatalogCard = { id: string; title: string; image?: string; meta?: string };
type TrendingAnime = {
  id: number;
  title: { romaji?: string; english?: string };
  coverImage: { large: string };
  averageScore?: number;
};

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
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        query: `query { Page(page: 1, perPage: 12) { media(type: ANIME, isAdult: false, sort: [TRENDING_DESC]) { id title { romaji english } coverImage { large } averageScore } } }`,
      }),
      next: { revalidate: 900 },
    });
    if (!response.ok) return [];
    const json = await response.json();
    const items: TrendingAnime[] = json.data?.Page?.media ?? [];
    return items.map((anime) => ({
      id: String(anime.id),
      title: anime.title.english || anime.title.romaji || "Anime",
      image: anime.coverImage.large,
      meta: anime.averageScore ? `★ ${anime.averageScore}%` : "Trending",
    }));
  } catch {
    return [];
  }
}

const discoveryCards = [
  { title: "Trending anime", detail: "Explore popular anime titles right now.", tag: "POPULAR NOW", href: "/search" },
  { title: "Weekly schedule", detail: "See upcoming episodes in Pakistan time.", tag: "AIRING CALENDAR", href: "/schedule" },
  { title: "Explore by language", detail: "Find titles across the languages you enjoy.", tag: "MORE WAYS TO WATCH", href: "/search" },
];

function CatalogSection({ title, eyebrow, items }: { title: string; eyebrow: string; items: CatalogCard[] }) {
  if (!items.length) return null;
  return <section className="mx-auto max-w-7xl px-5 py-12">
    <div className="mb-7"><p className="text-xs font-bold tracking-[.25em] text-[var(--accent)]">{eyebrow}</p><h2 className="mt-2 text-3xl font-bold">{title}</h2></div>
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">{items.slice(0, 12).map((anime) => <Link key={anime.id} href={`/anime/${encodeURIComponent(anime.id)}`} className="group overflow-hidden rounded-xl border border-white/10 bg-[#1b1b1b] transition hover:-translate-y-1 hover:border-[var(--accent)]/50"><div className="aspect-[3/4] overflow-hidden bg-[#252525]">{anime.image ? <img src={anime.image} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" /> : <div className="flex h-full items-center justify-center text-sm text-neutral-600">F Anime</div>}</div><div className="p-3"><h3 className="line-clamp-2 text-sm font-bold">{anime.title}</h3>{anime.meta && <p className="mt-2 text-xs text-neutral-500">{anime.meta}</p>}</div></Link>)}</div>
  </section>;
}

function mapProviderItems(items: ProviderAnime[]): CatalogCard[] {
  return items.map((item) => ({ id: item.id, title: item.title, image: item.image }));
}

export default async function HomePage() {
  const providerHome = await getProviderHome();
  const fallbackTrending = providerHome?.mostWatchedShows.length ? [] : await getTrending();
  const newestDrops = mapProviderItems(providerHome?.newestDrops ?? []);
  const newArrivals = mapProviderItems(providerHome?.newAnimeArrivals ?? []);
  const popular = providerHome?.mostWatchedShows.length ? mapProviderItems(providerHome.mostWatchedShows) : fallbackTrending;
  const animeMovies = mapProviderItems(providerHome?.animeMovies ?? []);

  return (
    <main className="min-h-screen overflow-hidden">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#101010]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" aria-label="F Anime home" className="text-xl font-black tracking-tight">F <span className="text-[var(--accent)]">ANIME</span></Link>
          <nav className="flex items-center gap-5 text-sm text-neutral-300 sm:gap-8">
            <Link href="/search" className="transition hover:text-white">Discover</Link>
            <Link href="/schedule" className="transition hover:text-white">Schedule</Link>
            <Link href="/search" className="rounded-full border border-[var(--accent)]/60 px-4 py-2 font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-black">Explore anime</Link>
          </nav>
        </div>
      </header>
      <section className="relative isolate border-b border-white/5">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_20%,rgba(255,145,0,.19),transparent_48%),radial-gradient(ellipse_at_15%_85%,rgba(255,94,0,.10),transparent_40%)]" />
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:py-32 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
          <div>
            <p className="mb-6 text-xs font-bold tracking-[.34em] text-[var(--accent)]">YOUR ANIME UNIVERSE</p>
            <h1 className="max-w-3xl text-5xl font-black leading-[1.02] tracking-tight sm:text-7xl">Every story.<br /><span className="text-[var(--accent)]">One place.</span></h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-neutral-400">Discover anime, keep up with new episodes, and find shows in the languages you love.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/search" className="rounded-lg bg-[var(--accent)] px-6 py-3 font-bold text-black transition hover:brightness-110">Browse anime <span className="ml-2">→</span></Link>
              <Link href="/schedule" className="rounded-lg border border-white/15 px-6 py-3 font-semibold text-white transition hover:border-white/40">View schedule</Link>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#191919]/90 p-6 shadow-2xl shadow-orange-950/20 sm:p-8">
            <p className="text-xs font-bold tracking-[.25em] text-[var(--accent)]">FIND YOUR LANGUAGE</p>
            <h2 className="mt-3 text-2xl font-bold">More ways to enjoy anime</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-400">Audio and subtitle options depend on each title and the provider that supplies it.</p>
            <div className="mt-6 flex flex-wrap gap-2">{languageOptions.map((language) => <span key={language} className="rounded-full border border-white/10 bg-white/[.04] px-3 py-2 text-sm text-neutral-200">{language}</span>)}</div>
          </div>
        </div>
      </section>
      <CatalogSection eyebrow="LATEST EPISODES" title="Newest drops" items={newestDrops} />
      <CatalogSection eyebrow="JUST ADDED" title="New anime arrivals" items={newArrivals} />
      <CatalogSection eyebrow="POPULAR RIGHT NOW" title="Most watched" items={popular} />
      <CatalogSection eyebrow="FEATURED FILMS" title="Anime movies" items={animeMovies} />
      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="mb-8"><p className="text-xs font-bold tracking-[.25em] text-[var(--accent)]">START EXPLORING</p><h2 className="mt-2 text-3xl font-bold">Discover F Anime</h2></div>
        <div className="grid gap-4 md:grid-cols-3">{discoveryCards.map((item) => <Link key={item.tag} href={item.href} className="group rounded-2xl border border-white/10 bg-[#1b1b1b] p-6 transition hover:-translate-y-1 hover:border-[var(--accent)]/50"><p className="text-xs font-bold tracking-widest text-[var(--accent)]">{item.tag}</p><div className="mt-8 flex items-center justify-between"><h3 className="text-xl font-bold">{item.title}</h3><span className="text-xl text-neutral-500 transition group-hover:translate-x-1 group-hover:text-[var(--accent)]">↗</span></div><p className="mt-2 text-sm leading-6 text-neutral-400">{item.detail}</p></Link>)}</div>
      </section>
      <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-neutral-500">F Anime · Your anime universe</footer>
    </main>
  );
}
