import Link from "next/link";
import { AnivexaApiProvider } from "@/lib/providers/anivexa-api";
import type { ProviderSource } from "@/lib/providers/types";
import HlsPlayer from "./HlsPlayer";
import EmbedPlayer from "@/components/embed-player";

export default async function AnivexaWatchPage({ params, searchParams }: {
  params: Promise<{ anilistId: string; audio: string; episode: string }>;
  searchParams: Promise<{ source?: string }>;
}) {
  const { anilistId, audio: rawAudio, episode: rawEpisode } = await params;
  const { source = "0" } = await searchParams;
  const audio = rawAudio === "dub" ? "dub" : "sub";
  const episode = Number(rawEpisode);
  const baseUrl = process.env.ANIVEXA_API_BASE_URL?.trim();
  const sources: ProviderSource[] = [];
  let attempted = 0;
  let episodeNumbers: number[] = [];
  let availableAudios: string[] = [];

  if (baseUrl && /^\d+$/.test(anilistId) && Number.isInteger(episode) && episode > 0) {
    try {
      const api = new AnivexaApiProvider(baseUrl);
      const available = await api.episodes(anilistId);
      const currentEpisodeRows = available.filter((item) => item.number === episode);
      availableAudios = [...new Set(currentEpisodeRows.map((item) => item.audio).filter(Boolean))] as string[];
      episodeNumbers = [...new Set(available.filter((item) => item.audio === audio).map((item) => item.number))].sort((a, b) => a - b);
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
  const currentIndex = episodeNumbers.indexOf(episode);
  const previousEpisode = currentIndex > 0 ? episodeNumbers[currentIndex - 1] : null;
  const nextEpisode = currentIndex >= 0 && currentIndex < episodeNumbers.length - 1 ? episodeNumbers[currentIndex + 1] : null;

  return <main className="min-h-screen bg-[#101010]">
    <header className="border-b border-white/10"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5"><Link href="/home" className="text-xl font-black">F <span className="text-[var(--accent)]">ANIME</span></Link><Link href={`/anime/${encodeURIComponent(anilistId)}`} className="text-sm text-neutral-300 hover:text-white">← Anime details</Link></div></header>
    <section className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6">
      <p className="text-xs font-bold tracking-[.25em] text-[var(--accent)]">ANIVEXA MULTI-PROVIDER PLAYER</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4"><h1 className="text-2xl font-black">Episode {episode} · {audio.toUpperCase()}</h1><div className="flex items-center gap-2">{availableAudios.includes("sub") && <Link href={`/watch/anivexa/${anilistId}/sub/${episode}`} className={`rounded-lg border px-3 py-2 text-xs font-bold ${audio === "sub" ? "border-[var(--accent)] text-[var(--accent)]" : "border-white/15 text-neutral-400"}`}>SUB</Link>}{availableAudios.includes("dub") && <Link href={`/watch/anivexa/${anilistId}/dub/${episode}`} className={`rounded-lg border px-3 py-2 text-xs font-bold ${audio === "dub" ? "border-[var(--accent)] text-[var(--accent)]" : "border-white/15 text-neutral-400"}`}>DUB</Link>}</div></div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          {!baseUrl ? <div className="rounded-xl border border-white/10 bg-[#1d1d1d] p-6"><h2 className="font-bold">Anivexa API not configured</h2><p className="mt-2 text-sm leading-6 text-neutral-400">The player is ready, but the optional Anivexa API base URL has not been configured.</p></div>
          : !selected ? <div className="rounded-xl border border-white/10 bg-[#1d1d1d] p-6"><h2 className="font-bold">No playable source found</h2><p className="mt-2 text-sm leading-6 text-neutral-400">{attempted ? "The providers listing this episode did not return a usable source. Try another episode or come back later." : "No configured provider lists this episode in the selected audio language."}</p></div>
          : <><div className="w-full overflow-hidden rounded-xl border border-white/10 bg-black">{selected.type === "iframe"
            ? <EmbedPlayer src={selected.url} title="F Anime player" />
            : <HlsPlayer src={selected.url} type={selected.type === "mp4" ? "mp4" : "hls"} />}</div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-bold">Available sources</h2><p className="mt-1 text-xs text-neutral-500">Sources are tried across providers that list this episode.</p></div><div className="flex gap-2">{previousEpisode && <Link href={`/watch/anivexa/${anilistId}/${audio}/${previousEpisode}`} className="rounded-lg border border-white/15 px-3 py-2 text-xs text-neutral-300">← Previous</Link>}{nextEpisode && <Link href={`/watch/anivexa/${anilistId}/${audio}/${nextEpisode}`} className="rounded-lg border border-[var(--accent)]/50 px-3 py-2 text-xs font-semibold text-[var(--accent)]">Next →</Link>}</div></div>
            <div className="mt-3 flex flex-wrap gap-2">{uniqueSources.map((item, index) => <Link key={item.id} href={`?source=${index}`} className={`rounded-lg border px-4 py-2 text-sm ${index === selectedIndex ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]" : "border-white/15 text-neutral-300 hover:border-white/40"}`}>{item.quality || `Source ${index + 1}`}</Link>)}</div>
          </>}
        </div>

        <aside className="rounded-xl border border-white/10 bg-[#181818] p-4">
          <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold tracking-[.2em] text-[var(--accent)]">EPISODE LIST</p><h2 className="mt-1 font-bold">Episodes</h2></div><span className="text-xs text-neutral-500">{episodeNumbers.length}</span></div>
          {episodeNumbers.length ? <div className="mt-4 max-h-[620px] space-y-1 overflow-y-auto pr-1">{episodeNumbers.map((number) => <Link key={number} href={`/watch/anivexa/${anilistId}/${audio}/${number}`} className={`flex items-center justify-between rounded-lg px-3 py-3 text-sm transition ${number === episode ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "text-neutral-300 hover:bg-white/5"}`}><span>Episode {number}</span>{number === episode ? <span className="text-xs">Playing</span> : <span className="text-xs text-neutral-600">▶</span>}</Link>)}</div> : <p className="mt-4 text-sm text-neutral-500">Episode list unavailable.</p>}
        </aside>
      </div>
    </section>
  </main>;
}
