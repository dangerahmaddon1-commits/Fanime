import Link from "next/link";

const suggestions = ["One Piece", "Naruto", "Demon Slayer", "Jujutsu Kaisen", "Solo Leveling"];

export default function LandingPage() {
  return <main className="min-h-screen overflow-hidden bg-[#101010]">
    <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(255,145,0,.16),transparent_48%),radial-gradient(ellipse_at_15%_80%,rgba(255,94,0,.08),transparent_38%)]" />
    <header className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-6">
      <Link href="/" className="text-2xl font-black tracking-tight">F <span className="text-[var(--accent)]">ANIME</span></Link>
      <nav className="flex items-center gap-5 text-sm text-neutral-300"><Link href="/home" className="hover:text-white">Catalog</Link><Link href="/schedule" className="hover:text-white">Schedule</Link><Link href="/search" className="rounded-full border border-[var(--accent)]/50 px-4 py-2 font-semibold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-black">Discover</Link></nav>
    </header>

    <section className="relative mx-auto flex min-h-[650px] max-w-5xl flex-col items-center justify-center px-5 pb-24 pt-20 text-center">
      <p className="text-xs font-bold tracking-[.4em] text-[var(--accent)]">YOUR ANIME UNIVERSE</p>
      <h1 className="mt-6 text-5xl font-black tracking-tight sm:text-7xl">Watch Anime <span className="text-[var(--accent)]">Online.</span></h1>
      <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-400 sm:text-lg">Find your next series, explore new episodes, and follow the weekly airing schedule — all in one place.</p>
      <form action="/search" className="mt-10 flex w-full max-w-2xl items-center gap-2 rounded-2xl border border-white/10 bg-[#1b1b1b] p-2 shadow-2xl shadow-black/40">
        <span className="pl-3 text-xl text-neutral-500">⌕</span>
        <input name="q" placeholder="Search anime..." className="min-w-0 flex-1 bg-transparent px-2 py-3 text-left text-sm outline-none placeholder:text-neutral-600 sm:text-base" />
        <button className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-black transition hover:brightness-110">Search</button>
      </form>
      <div className="mt-5 flex flex-wrap justify-center gap-2">{suggestions.map((name) => <Link key={name} href={`/search?q=${encodeURIComponent(name)}`} className="rounded-full border border-white/10 bg-white/[.03] px-3 py-2 text-xs text-neutral-400 transition hover:border-[var(--accent)]/40 hover:text-white">{name}</Link>)}</div>
      <div className="mt-10 flex flex-wrap justify-center gap-3"><Link href="/home" className="rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-bold text-black transition hover:brightness-110">Browse catalog <span className="ml-2">→</span></Link><Link href="/schedule" className="rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40">View schedule</Link></div>
    </section>

    <section className="relative mx-auto max-w-6xl border-t border-white/10 px-5 py-20">
      <div className="mx-auto max-w-3xl text-center"><p className="text-xs font-bold tracking-[.3em] text-[var(--accent)]">ABOUT F ANIME</p><h2 className="mt-4 text-3xl font-black sm:text-4xl">Your anime, all together.</h2><p className="mt-5 leading-8 text-neutral-400">F Anime brings anime discovery, episode availability and airing information into one streamlined experience. Explore titles and see which providers and audio options are available.</p></div>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-[#181818] p-6"><p className="text-2xl text-[var(--accent)]">▤</p><h3 className="mt-5 text-lg font-bold">Explore the catalog</h3><p className="mt-2 text-sm leading-6 text-neutral-400">Search anime, browse popular titles and discover new arrivals.</p></article>
        <article className="rounded-2xl border border-white/10 bg-[#181818] p-6"><p className="text-2xl text-[var(--accent)]">◷</p><h3 className="mt-5 text-lg font-bold">Keep up with airing</h3><p className="mt-2 text-sm leading-6 text-neutral-400">Check upcoming episodes with a weekly schedule in Pakistan time.</p></article>
        <article className="rounded-2xl border border-white/10 bg-[#181818] p-6"><p className="text-2xl text-[var(--accent)]">◎</p><h3 className="mt-5 text-lg font-bold">Multiple language options</h3><p className="mt-2 text-sm leading-6 text-neutral-400">Provider availability can include Japanese, English, Hindi, Tamil, Telugu and more.</p></article>
      </div>
      <div className="mt-14 text-center"><Link href="/home" className="inline-flex rounded-xl border border-[var(--accent)]/50 px-6 py-3 text-sm font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-black">Explore F Anime →</Link></div>
    </section>
    <footer className="relative border-t border-white/10 px-5 py-8 text-center text-xs text-neutral-500">F Anime · Your anime universe · <Link href="/home" className="hover:text-white">Catalog</Link> · <Link href="/schedule" className="hover:text-white">Schedule</Link></footer>
  </main>;
}
