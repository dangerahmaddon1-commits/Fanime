import Link from "next/link";
import { getRenimeProviderOrder } from "@/lib/providers/provider-order";
import type { ProviderSource } from "@/lib/providers/types";
import EmbedPlayer from "@/components/embed-player";

export default async function WatchPage({ params, searchParams }: {
  params: Promise<{ animeId: string; episodeId: string }>;
  searchParams: Promise<{ server?: string }>;
}) {
  const { animeId, episodeId } = await params;
  const { server = "0" } = await searchParams;
  const baseUrl = process.env.RENIME_API_BASE_URL?.trim();
  let sources: ProviderSource[] = [];
  let failed = false;
  try {
    for (const provider of getRenimeProviderOrder(baseUrl)) {
      try {
        const candidateSources = await provider.sources({ episodeId });
        if (candidateSources.length) { sources = candidateSources; break; }
      } catch {
        // Try the alternate catalog if this provider has no source.
      }
    }
    failed = sources.length === 0;
  } catch {
    failed = true;
  }
  const selectedIndex = Math.max(0, Math.min(Number(server) || 0, Math.max(0, sources.length - 1)));
  const selected = sources[selectedIndex];

  return <main className="min-h-screen bg-[#101010]">
    <header className="border-b border-white/10"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5"><Link href="/home" className="text-xl font-black">F <span className="text-[var(--accent)]">ANIME</span></Link><Link href={`/anime/${encodeURIComponent(animeId)}`} className="text-sm text-neutral-300 hover:text-white">← Anime details</Link></div></header>
    <section className="mx-auto max-w-7xl px-5 py-8">
      <p className="text-xs font-bold tracking-[.25em] text-[var(--accent)]">NOW PLAYING</p>
      <h1 className="mt-2 text-2xl font-black">Episode {episodeId}</h1>
      {failed || !selected ? <div className="mt-8 rounded-xl border border-white/10 bg-[#1d1d1d] p-6"><h2 className="font-bold">No playback source available</h2><p className="mt-2 text-sm leading-6 text-neutral-400">Neither configured provider returned a playable embed for this episode. You can try again later or return to the anime details.</p></div>
      : <><div className="mt-6"><EmbedPlayer src={selected.url} /></div>
        <div className="mt-5"><h2 className="font-bold">Available servers</h2><div className="mt-3 flex flex-wrap gap-2">{sources.map((source, index) => <Link key={source.id} href={`?server=${index}`} className={`rounded-lg border px-4 py-2 text-sm ${index === selectedIndex ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]" : "border-white/15 text-neutral-300 hover:border-white/40"}`}>{source.quality || `Server ${index + 1}`}{source.language && source.language !== "unknown" ? ` · ${source.language}` : ""}</Link>)}</div></div>
      </>}
    </section>
  </main>;
}
