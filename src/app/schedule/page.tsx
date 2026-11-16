import Link from "next/link";

type Airing = { id: number; airingAt: number; episode: number; media: { id: number; title: { romaji?: string; english?: string }; coverImage: { large: string }; format?: string } };

function dateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

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

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const { day } = await searchParams;
  let items: Airing[] = [];
  let failed = false;
  try { items = await getSchedule(); } catch { failed = true; }

  const today = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getTime() + index * 86400000);
    return {
      key: dateKey(date),
      weekday: new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", weekday: "short" }).format(date),
      date: new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", day: "numeric", month: "short" }).format(date),
    };
  });
  const selectedDay = days.some((item) => item.key === day) ? day as string : days[0].key;
  const selectedItems = items.filter((item) => dateKey(new Date(item.airingAt * 1000)) === selectedDay);

  return <main className="min-h-screen bg-[#101010]">
    <header className="border-b border-white/10"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5"><Link href="/" className="text-xl font-black">F <span className="text-[var(--accent)]">ANIME</span></Link><nav className="flex gap-5 text-sm text-neutral-300"><Link href="/search">Discover</Link><Link href="/schedule" className="text-white">Schedule</Link></nav></div></header>
    <section className="mx-auto max-w-7xl px-5 py-10">
      <p className="text-xs font-bold tracking-[.25em] text-[var(--accent)]">AIRING CALENDAR</p><h1 className="mt-3 text-4xl font-black">Weekly schedule</h1><p className="mt-3 text-neutral-400">Upcoming episodes for the next 7 days · Pakistan time (PKT).</p>
      <div className="mt-8 grid grid-cols-4 gap-2 sm:grid-cols-7">{days.map((item) => <Link key={item.key} href={`?day=${item.key}`} className={`rounded-xl border px-2 py-3 text-center transition ${selectedDay === item.key ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]" : "border-white/10 bg-[#1b1b1b] text-neutral-400 hover:border-white/30"}`}><span className="block text-xs font-semibold">{item.weekday}</span><span className="mt-1 block text-sm font-bold">{item.date}</span></Link>)}</div>
      {failed ? <p className="mt-8 rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-red-200">The airing schedule is temporarily unavailable. Please try again shortly.</p>
      : selectedItems.length === 0 ? <p className="mt-8 rounded-xl border border-white/10 bg-[#1b1b1b] p-6 text-neutral-400">No episodes are currently listed for this date.</p>
      : <div className="mt-8 space-y-3">{selectedItems.map((show) => <Link key={show.id} href={`/anime/${show.media.id}`} className="flex gap-4 rounded-xl border border-white/10 bg-[#1b1b1b] p-4 transition hover:border-[var(--accent)]/50"><img src={show.media.coverImage.large} alt="" className="h-28 w-20 rounded-lg object-cover" loading="lazy" /><div className="min-w-0 flex-1"><p className="text-xs font-bold tracking-wider text-[var(--accent)]">{new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", hour: "numeric", minute: "2-digit" }).format(new Date(show.airingAt * 1000))} PKT</p><h2 className="mt-2 text-lg font-bold">{show.media.title.english || show.media.title.romaji}</h2><p className="mt-1 text-sm text-neutral-400">Episode {show.episode} · {show.media.format ?? "Anime"}</p></div><span className="self-center text-xl text-neutral-600">→</span></Link>)}</div>}
    </section>
  </main>;
}
