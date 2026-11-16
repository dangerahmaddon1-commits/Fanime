const picks = [
  { title: "Explore seasonal anime", detail: "Find currently airing series", tag: "SEASONAL" },
  { title: "Trending now", detail: "See what anime fans are watching", tag: "TRENDING" },
  { title: "Build your watchlist", detail: "Keep your next series close", tag: "YOUR LIST" },
];

export default function HomePage() {
  return <main className="min-h-screen">
    <header className="sticky top-0 z-10 border-b border-white/10 bg-[#101010]/90 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5"><a href="/" className="text-2xl font-black tracking-tight">fanime<span className="text-[#ff4545]">.</span></a><nav className="flex items-center gap-6 text-sm text-neutral-300"><a href="#discover" className="hover:text-white">Discover</a><a href="/search" className="hover:text-white">Search</a></nav></div></header>
    <section className="mx-auto max-w-7xl px-5 pb-20 pt-24"><p className="mb-5 text-xs font-bold tracking-[.3em] text-[#ff4545]">YOUR ANIME UNIVERSE</p><h1 className="max-w-3xl text-5xl font-black leading-[1.08] tracking-tight sm:text-7xl">Find your next <span className="text-[#ff4545]">obsession.</span></h1><p className="mt-7 max-w-xl text-lg leading-8 text-neutral-400">Discover anime, explore stories, and keep your watchlist in one place.</p><a href="#discover" className="mt-9 inline-flex rounded-lg bg-[#ff4545] px-6 py-3 font-bold text-white transition hover:bg-red-500">Explore anime <span className="ml-3">→</span></a></section>
    <section id="discover" className="mx-auto max-w-7xl px-5 pb-24"><div className="mb-7 flex items-end justify-between"><div><p className="text-xs font-bold tracking-[.25em] text-[#ff4545]">START EXPLORING</p><h2 className="mt-2 text-3xl font-bold">Discover Fanime</h2></div><span className="text-sm text-neutral-500">Catalog integration next</span></div><div className="grid gap-4 md:grid-cols-3">{picks.map((item) => <article key={item.tag} className="rounded-2xl border border-white/10 bg-[#1d1d1d] p-6"><p className="text-xs font-bold tracking-widest text-[#ff4545]">{item.tag}</p><h3 className="mt-8 text-xl font-bold">{item.title}</h3><p className="mt-2 text-sm text-neutral-400">{item.detail}</p></article>)}</div></section>
    <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-neutral-500">Fanime · Your anime universe</footer>
  </main>;
}
