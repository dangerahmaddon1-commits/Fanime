import Link from "next/link";
import { AnivexaApiProvider } from "@/lib/providers/anivexa-api";
import type { ProviderSource } from "@/lib/providers/types";
import HlsPlayer from "./HlsPlayer";

export default async function AnivexaWatchPage({ params, searchParams }: {
  params: Promise<{ anilistId: string; audio: string; episode: string }>;
  searchParams: Promise<{ source?: string }>;
}) {
  const { anilistId, audio: rawAudio, episode: rawEpisode } = await params;
  const { source = "0" } = await searchParams;
  const audio = rawAudio === "dub" ? "dub" : "sub";
  const episode = Number(rawEpisode);
  const baseUrl = process.env.ANIVEXA_API_BASE_URL?.trim();
  let sources: ProviderSource[] = [];
  let attempted = 0;

  if (baseUrl && /^\d+$/.test(anilistId) && Number.isInteger(episode) && episode > 0) {
    try {
      const api = new AnivexaApiProvider(baseUrl);
      const available = await api.episodes(anilistId);
      const providers = [...new Set(available.filter((item) => item.number === episode && item.audio === audio && item.provider).map((item) => item.provider as string))];
      for (const provider of providers) {
        attempted += 1;
        try {
          const candidate = await api.watch(provider, anilistId, audio, episode);
          if (candidate.length) {
            sources.push(...candidate.map((item) => ({ ...item, quality: `${provider} · ${item.quality || "Server"}` })));
          }
        } catch {
          // Continue to the next provider that lists this episode.
        }
      }
    } catch {
      // Render a useful unavailable state below.
    }
  }

  const uniqueSources = sources.filter((item, index, all) => all.findIndex((candidate) => candidate.url === item.url) === index);
  uniqueSources.sort((a, b) => Number(a.type !== "iframe") - Number(b.type !== "iframe"));
  const selectedIndex = Math.max(0, Math.min(Number(source) || 0, Math.max(0, uniqueSources.length - 1)));
  const selected = uniqueSources[selectedIndex];

  return <main className="min-h-screen bg-[#101010]">
    <header className="border-b border-white/10"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5"><Link href="/home" className="text-xl font-black">F <span className="text-[var(--accent)]">ANIME</span></Link><Link href={`/anime/${encodeURIComponent(anilistId)}`} className="text-sm text-neutral-300 hover:text-white">← Anime details</Link></div></header>
    <section className="mx-auto max-w-7xl px-5 py-8">
      <p className="text-xs font-bold tracking-[.25em] text-[var(--accent)]">ANIVEXA MULTI-PROVIDER PLAYER</p>
      <h1 className="mt-2 text-2xl font-black">Episode {episode} · {audio.toUpperCase()}</h1>
      {!baseUrl ? <div className="mt-8 rounded-xl border border-white/10 bg-[#1d1d1d] p-6"><h2 className="font-bold">Anivexa API not configured</h2><p className="mt-2 text-sm leading-6 text-neutral-400">The player is ready, but the optional Anivexa API base URL has not been configured.</p></div>
      : !selected ? <div className="mt-8 rounded-xl border border-white/10 bg-[#1d1d1d] p-6"><h2 className="font-bold">No playable source found</h2><p className="mt-2 text-sm leading-6 text-neutral-400">{attempted ? "The providers listing this episode did not return a usable source. Try again later." : "No configured provider lists this episode in the selected audio language."}</p></div>
      : <><div className="mt-6 aspect-video overflow-hidden rounded-xl border border-white/10 bg-black">{selected.type === "iframe"
        ? <iframe src={selected.url} title="F Anime player" className="h-full w-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-forms allow-presentation" />
        : <HlsPlayer src={selected.url} />}</div>
        <div className="mt-5"><h2 className="font-bold">Available sources</h2><div className="mt-3 flex flex-wrap gap-2">{uniqueSources.map((item, index) => <Link key={item.id} href={`?source=${index}`} className={`rounded-lg border px-4 py-2 text-sm ${index === selectedIndex ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]" : "border-white/15 text-neutral-300 hover:border-white/40"}`}>{item.quality || `Source ${index + 1}`}</Link>)}</div></div>
      </>}
    </section>
  </main>;
}
