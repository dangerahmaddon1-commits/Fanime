import Link from "next/link";
import { notFound } from "next/navigation";

type Anime = { id: number; title: { romaji?: string; english?: string; native?: string }; coverImage: { large: string }; bannerImage?: string; description?: string; episodes?: number; seasonYear?: number; format?: string; status?: string; averageScore?: number; genres?: string[] };

async function getAnime(id: string): Promise<Anime | null> {
  const response = await fetch("https://graphql.anilist.co", {
    method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: `query ($id: Int!) { Media(id: $id, type: ANIME) { id title { romaji english native } coverImage { large } bannerImage description(asHtml: false) episodes seasonYear format status averageScore genres } }`, variables: { id: Number(id) } }),
    next: { revalidate: 3600 },
  });
  if (!response.ok) return null;
  const json = await response.json();
  return json.data?.Media ?? null;
}

export default async function AnimeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const anime = await getAnime(id);
  if (!anime) notFound();
  const title = anime.title.english || anime.title.romaji || anime.title.native || "Anime";
  return <main className="min-h-screen">
    <div className="relative min-h-72 border-b border-white/10 bg-[#181818]">
      {anime.bannerImage && <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: `linear-gradient(to bottom,rgba(16,16,16,.25),#101010),url(${anime.bannerImage})` }} />}
      <header className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-5"><Link href="/" className="text-2xl font-black">F<span className="text-[var(--accent)]">.</span></Link><nav className="flex gap-5 text-sm"><Link href="/search">Discover</Link><Link href="/schedule">Schedule</Link></nav></header>
      <div className="relative mx-auto flex max-w-7xl items-end gap-7 px-5 pb-10 pt-10"><img src={anime.coverImage.large} alt="" className="hidden w-40 rounded-xl shadow-2xl sm:block" /><div><p className="text-xs font-bold tracking-[.25em] text-[var(--accent)]">ANIME DETAILS</p><h1 className="mt-3 text-3xl font-black sm:text-5xl">{title}</h1><p className="mt-3 text-sm text-neutral-400">{[anime.seasonYear, anime.format, anime.status, anime.episodes ? `${anime.episodes} episodes` : null, anime.averageScore ? `Score ${anime.averageScore}%` : null].filter(Boolean).join(" · ")}</p><div className="mt-4 flex flex-wrap gap-2">{anime.genres?.map((genre) => <span key={genre} className="rounded-full border border-white/15 px-3 py-1 text-xs text-neutral-300">{genre}</span>)}</div></div></div>
    </div>
    <section className="mx-auto max-w-7xl px-5 py-10"><h2 className="text-2xl font-bold">Synopsis</h2><p className="mt-4 max-w-4xl whitespace-pre-line leading-8 text-neutral-300">{anime.description?.replace(/<[^>]*>/g, "") || "No synopsis is available yet."}</p>
      <div className="mt-10 rounded-2xl border border-[var(--accent)]/30 bg-[#1b1b1b] p-6"><p className="font-bold">Watch availability</p><p className="mt-2 text-sm leading-6 text-neutral-400">Episode and playback sources are not connected for this title yet. This detail page currently uses AniList metadata. Provider playback will appear here once a compatible provider is configured and verified.</p><Link href="/search" className="mt-4 inline-block font-semibold text-[var(--accent)]">← Back to discovery</Link></div>
    </section>
  </main>;
}
