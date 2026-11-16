import Link from "next/link";

type Airing = { id: number; airingAt: number; episode: number; media: { id: number; title: { romaji?: string; english?: string }; coverImage: { large: string }; format?: string } };

async function getSchedule(): Promise<Airing[]> {
  const now = Math.floor(Date.now() / 1000);
  const response = await fetch("https://graphql.anilist.co", {
    method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: `query ($start: Int!, $end: Int!) { Page(page: 1, perPage: 50) { airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) { id airingAt episode media { id title { romaji english } coverImage { large } format } } } }`, variables: { start: now, end: now + 7 * 86400 } }),
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error("Schedule unavailable");
  const json = await response.json();
  return json.data?.Page?.airingSchedules ?? [];
}

export default async function SchedulePage() {
  let items: Airing[] = []; let failed = false;
  try { items = await getSchedule(); } catch { failed = true; }
  const days = new Map<string, Airing[]>();
  for (const item of items) { const key = new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", weekday: "long", day: "numeric", month: "long" }).format(new Date(item.airingAt * 1000)); days.set(key, [...(days.get(key) ?? []), item]); }
  return <main className="min-h-screen"><header className="border-b border-white/10"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5"><Link href="/" className="text-2xl font-black">F<span className="text-[var(--accent)]">.</span></Link><nav className="flex gap-5 text-sm text-neutral-300"><Link href="/search">Discover</Link><Link href="/schedule" className="text-white">Schedule</Link></nav></div></header>
    <section className="mx-auto max-w-7xl px-5 py-12"><p className="text-xs font-bold tracking-[.25em] text-[var(--accent)]">AIRING CALENDAR</p><h1 className="mt-3 text-4xl font-black">Weekly schedule</h1><p className="mt-3 text-neutral-400">Upcoming episodes for the next 7 days · Pakistan time (PKT).</p>
    {failed ? <p className="mt-8 rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-red-200">The airing schedule is temporarily unavailable. Please try again shortly.</p> : items.length === 0 ? <p className="mt-8 text-neutral-400">No upcoming episodes were returned for the next seven days.</p> : <div className="mt-10 space-y-10">{[...days.entries()].map(([day, shows]) => <section key={day}><h2 className="mb-4 border-b border-white/10 pb-3 text-xl font-bold">{day}</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{shows.map((show) => <Link key={show.id} href={`/anime/${show.media.id}`} className="flex gap-4 rounded-xl border border-white/10 bg-[#1b1b1b] p-3 transition hover:border-[var(--accent)]/50"><img src={show.media.coverImage.large} alt="" className="h-24 w-16 rounded-lg object-cover" loading="lazy" /><div className="min-w-0"><h3 className="line-clamp-2 font-bold">{show.media.title.english || show.media.title.romaji}</h3><p className="mt-2 text-sm text-[var(--accent)]">Episode {show.episode}</p><p className="mt-1 text-xs text-neutral-500">{new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit" }).format(new Date(show.airingAt * 1000))} PKT · {show.media.format ?? "Anime"}</p></div></Link>)}</div></section>)}</div>}</section></main>;
}
