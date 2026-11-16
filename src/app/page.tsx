const languageOptions = ["Japanese", "English", "Hindi", "Tamil", "Telugu", "Korean", "Chinese"];

const discoveryCards = [
  { title: "Trending anime", detail: "Explore popular anime titles right now.", tag: "POPULAR NOW", href: "/search" },
  { title: "Weekly schedule", detail: "See upcoming episodes in Pakistan time.", tag: "AIRING CALENDAR", href: "/schedule" },
  { title: "Explore by language", detail: "Find titles across the languages you enjoy.", tag: "MORE WAYS TO WATCH", href: "/search" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#101010]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <a href="/" aria-label="F Anime home" className="text-xl font-black tracking-tight">F <span className="text-[var(--accent)]">ANIME</span></a>
          <nav className="flex items-center gap-5 text-sm text-neutral-300 sm:gap-8">
            <a href="/search" className="transition hover:text-white">Discover</a>
            <a href="/schedule" className="transition hover:text-white">Schedule</a>
            <a href="/search" className="rounded-full border border-[var(--accent)]/60 px-4 py-2 font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-black">Explore anime</a>
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
              <a href="/search" className="rounded-lg bg-[var(--accent)] px-6 py-3 font-bold text-black transition hover:brightness-110">Browse anime <span className="ml-2">→</span></a>
              <a href="/schedule" className="rounded-lg border border-white/15 px-6 py-3 font-semibold text-white transition hover:border-white/40">View schedule</a>
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
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="mb-8"><p className="text-xs font-bold tracking-[.25em] text-[var(--accent)]">START EXPLORING</p><h2 className="mt-2 text-3xl font-bold">Discover F Anime</h2></div>
        <div className="grid gap-4 md:grid-cols-3">{discoveryCards.map((item) => <a key={item.tag} href={item.href} className="group rounded-2xl border border-white/10 bg-[#1b1b1b] p-6 transition hover:-translate-y-1 hover:border-[var(--accent)]/50"><p className="text-xs font-bold tracking-widest text-[var(--accent)]">{item.tag}</p><div className="mt-8 flex items-center justify-between"><h3 className="text-xl font-bold">{item.title}</h3><span className="text-xl text-neutral-500 transition group-hover:translate-x-1 group-hover:text-[var(--accent)]">↗</span></div><p className="mt-2 text-sm leading-6 text-neutral-400">{item.detail}</p></a>)}</div>
      </section>
      <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-neutral-500">F Anime · Your anime universe</footer>
    </main>
  );
}
