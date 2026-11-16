import Link from "next/link";
import { notFound } from "next/navigation";
import { getRenimeProviderOrder } from "@/lib/providers/provider-order";
import type { ProviderDetails, ProviderEpisode } from "@/lib/providers/types";

type AniListAnime = {
  id: number;
  title: { romaji?: string; english?: string; native?: string };
  coverImage: { large: string };
  bannerImage?: string;
  description?: string;
  episodes?: number;
  seasonYear?: number;
  format?: string;
  status?: string;
  averageScore?: number;
  genres?: string[];
};

async function getAniListAnime(id: string): Promise<AniListAnime | null> {
  if (!/^\d+$/.test(id)) return null;
  const response = await fetch("https://graphql.anilist.co", {
    method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      query: `query ($id: Int!) { Media(id: $id, type: ANIME) { id title { romaji english native } coverImage { large } bannerImage description(asHtml: false) episodes seasonYear format status averageScore genres } }`,
      variables: { id: Number(id) },
    }),
    next: { revalidate: 3600 },
  });
  if (!response.ok) return null;
  const json = await response.json();
  return json.data?.Media ?? null;
}

export default async function AnimeDetailPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ season?: string }>;
}) {
  const { id } = await params;
  const { season: seasonParam } = await searchParams;
  const baseUrl = process.env.RENIME_API_BASE_URL?.trim();
  let providerDetails: ProviderDetails | null = null;
  let providerError = false;
  let selectedSeason = Math.max(1, Number(seasonParam) || 1);
  let episodeList: ProviderEpisode[] = [];

  if (baseUrl) {
    try {
      for (const provider of getRenimeProviderOrder(baseUrl)) {
        try {
          const candidate = await provider.details(id);
          if (!providerDetails || candidate.episodes.length > providerDetails.episodes.length) {
            providerDetails = candidate;
          }
          if (candidate.episodes.length) break;
        } catch {
          // Try the alternate catalog before falling back to AniList.
        }
      }
      if (providerDetails) {
        if (providerDetails.seasons.length && !providerDetails.seasons.includes(selectedSeason)) {
          selectedSeason = providerDetails.seasons[0];
        }
        episodeList = providerDetails.episodes;
        if (seasonParam && selectedSeason !== 1) {
          for (const provider of getRenimeProviderOrder(baseUrl)) {
            try {
              const candidateEpisodes = await provider.episodes({ animeId: id, season: selectedSeason });
              if (candidateEpisodes.length) { episodeList = candidateEpisodes; break; }
            } catch {
              // Keep the episode list returned by the details endpoint.
            }
          }
        }
      }
    } catch {
      providerError = true;
      providerDetails = null;
    }
  }

  const aniList = providerDetails ? null : await getAniListAnime(id);
  if (!providerDetails && !aniList) notFound();

  const title = providerDetails?.title || aniList?.title.english || aniList?.title.romaji || aniList?.title.native || "Anime";
  const image = providerDetails?.image || aniList?.coverImage.large;
  const background = providerDetails?.background || aniList?.bannerImage;
  const description = providerDetails?.description || aniList?.description?.replace(/<[^>]*>/g, "");
  const genres = providerDetails?.genres ?? aniList?.genres ?? [];
  const metadata = providerDetails
    ? [providerDetails.year, providerDetails.type, providerDetails.languages.join(" / ")].filter(Boolean).join(" · ")
    : [aniList?.seasonYear, aniList?.format, aniList?.status, aniList?.episodes ? `${aniList.episodes} episodes` : null, aniList?.averageScore ? `Score ${aniList.averageScore}%` : null].filter(Boolean).join(" · ");

  return <main className="min-h-screen">
    <div className="relative min-h-72 border-b border-white/10 bg-[#181818]">
      {background && <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: `linear-gradient(to bottom,rgba(16,16,16,.25),#101010),url(${background})` }} />}
      <header className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-5"><Link href="/" className="text-xl font-black tracking-tight">F <span className="text-[var(--accent)]">ANIME</span></Link><nav className="flex gap-5 text-sm"><Link href="/search">Discover</Link><Link href="/schedule">Schedule</Link></nav></header>
      <div className="relative mx-auto flex max-w-7xl items-end gap-7 px-5 pb-10 pt-10">{image && <img src={image} alt="" className="hidden w-40 rounded-xl shadow-2xl sm:block" />}<div><p className="text-xs font-bold tracking-[.25em] text-[var(--accent)]">ANIME DETAILS</p><h1 className="mt-3 text-3xl font-black sm:text-5xl">{title}</h1><p className="mt-3 text-sm text-neutral-400">{metadata}</p><div className="mt-4 flex flex-wrap gap-2">{genres.map((genre) => <span key={genre} className="rounded-full border border-white/15 px-3 py-1 text-xs text-neutral-300">{genre}</span>)}</div></div></div>
    </div>
    <section className="mx-auto max-w-7xl px-5 py-10">
      <h2 className="text-2xl font-bold">Synopsis</h2><p className="mt-4 max-w-4xl whitespace-pre-line leading-8 text-neutral-300">{description || "No synopsis is available yet."}</p>
      {providerDetails ? <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold tracking-[.25em] text-[var(--accent)]">EPISODE GUIDE</p><h2 className="mt-2 text-2xl font-bold">Episodes</h2></div><span className="text-sm text-neutral-500">{episodeList.length} listed</span></div>
        {providerDetails.seasons.length > 1 && <div className="mt-5 flex flex-wrap gap-2">{providerDetails.seasons.map((season) => <Link key={season} href={`?season=${season}`} className={`rounded-lg border px-4 py-2 text-sm ${season === selectedSeason ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]" : "border-white/15 text-neutral-300 hover:border-white/40"}`}>Season {season}</Link>)}</div>}
        {episodeList.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{episodeList.map((episode) => <Link key={episode.id} href={`/watch/${encodeURIComponent(id)}/${encodeURIComponent(episode.id)}`} className="flex items-center gap-4 rounded-xl border border-white/10 bg-[#1b1b1b] p-3 transition hover:border-[var(--accent)]/50">{episode.image && <img src={episode.image} alt="" className="h-16 w-24 rounded-lg object-cover" loading="lazy" />}<div><p className="font-bold">Episode {episode.number}</p><p className="mt-1 text-sm text-neutral-400">{episode.title || title}</p></div><span className="ml-auto text-[var(--accent)]">▶</span></Link>)}</div> : <p className="mt-5 text-neutral-400">The provider did not return an episode list for this season.</p>}
      </section> : <div className="mt-10 rounded-2xl border border-[var(--accent)]/30 bg-[#1b1b1b] p-6"><p className="font-bold">Episode availability</p><p className="mt-2 text-sm leading-6 text-neutral-400">{providerError ? "The configured episode provider is currently unavailable. General anime details are still available." : "This title is currently showing general catalog information. Episode listings will appear when a Renime API endpoint is configured."}</p><Link href="/search" className="mt-4 inline-block font-semibold text-[var(--accent)]">← Back to discovery</Link></div>}
    </section>
  </main>;
}
