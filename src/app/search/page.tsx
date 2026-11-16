import Link from "next/link";

type Anime = {
  id: number;
  title: { romaji?: string; english?: string; native?: string };
  coverImage: { large: string };
  episodes?: number;
  seasonYear?: number;
  format?: string;
  averageScore?: number;
  genres?: string[];
};

async function searchAnime(query: string): Promise<Anime[]> {
  if (!query) return [];
  const response = await fetch(`https://graphql.anilist.co`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      query: `query ($search: String!) { Page(page: 1, perPage: 24) { media(search: $search, type: ANIME, isAdult: false, sort: [SEARCH_MATCH]) { id title { romaji english native } coverImage { large } episodes seasonYear format averageScore genres } } }`,
      variables: { search: query },
    }),
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error("Anime catalog is temporarily unavailable.");
  const json = await response.json();
  return json.data?.Page?.media ?? [];
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  let items: Anime[] = [];
  let error = "";
  try { items = await searchAnime(q.trim()); } catch { error = "The anime catalog could not be reached. Please try again shortly."; }
  return <main className="min-h-screen">
    <header className="border-b border-white/10"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5"><Link href="/" className="text-2xl font-black">F<span className="text-[var(--accent)]">.</span></Link><nav className="flex gap-5 text-sm text-neutral-300"><Link href="/search" className="text-white">Discover</Link><Link href="/schedule">Schedule</Link></nav></div></header>
    <section className="mx-auto max-w-7xl px-5 py-12">
      <p className="text-xs font-bold tracking-[.25em] text-[var(--accent)]">F ANIME DISCOVERY</p><h1 className="mt-3 text-4xl font-black">Find your next anime.</h1>
      <form action="/search" className="mt-8 flex max-w-2xl gap-2"><input name="q" defaultValue={q} placeholder="Search anime titles..." className="min-w-0 flex-1 rounded-xl border border-white/15 bg-[#1d1d1d] px-4 py-3 outline-none focus:border-[var(--accent)]" /><button className="rounded-xl bg-[var(--accent)] px-6 py-3 font-bold text-black">Search</button></form>
      <div className="mt-10 flex items-center justify-between"><h2 className="text-xl font-bold">{q ? `Results for “${q}”` : "Search the anime catalog"}</h2><span className="text-sm text-neutral-500">{items.length} titles</span></div>
      {error && <p className="mt-8 rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-red-200">{error}</p>}
      {!q && <p className="mt-5 text-neutral-400">Search thousands of anime titles by name. Choose a title to explore its details.</p>}
      {q && items.length === 0 && !error && <p className="mt-8 text-neutral-400">No matching anime found. Try another title.</p>}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">{items.map((anime) => <Link key={anime.id} href={`/anime/${anime.id}`} className="group overflow-hidden rounded-xl border border-white/10 bg-[#1b1b1b] transition hover:-translate-y-1 hover:border-[var(--accent)]/60"><div className="aspect-[3/4] overflow-hidden bg-[#252525]"><img src={anime.coverImage.large} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" /></div><div className="p-3"><h3 className="line-clamp-2 text-sm font-bold">{anime.title.english || anime.title.romaji || anime.title.native}</h3><p className="mt-2 text-xs text-neutral-500">{[anime.seasonYear, anime.format, anime.episodes ? `${anime.episodes} eps` : null].filter(Boolean).join(" · ")}</p></div></Link>)}</div>
    </section>
  </main>;
}
