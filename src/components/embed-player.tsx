"use client";

import { useState } from "react";

export default function EmbedPlayer({ src, title = "F Anime episode player" }: { src: string; title?: string }) {
  const [loaded, setLoaded] = useState(false);
  return <div className="w-full">
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      {!loaded && <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#090909] text-center text-sm text-neutral-400">Loading video player…</div>}
      <iframe
        key={src}
        src={src}
        title={title}
        className="absolute inset-0 h-full w-full border-0"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-write"
        allowFullScreen
        loading="eager"
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={() => setLoaded(true)}
      />
    </div>
    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
      <span>If the embedded player is blocked by its provider, use the external player link.</span>
      <a href={src} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/15 px-3 py-2 font-semibold text-[var(--accent)] hover:bg-white/5">Open player ↗</a>
    </div>
  </div>;
}
