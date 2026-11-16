"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

export default function HlsPlayer({ src, type = "hls" }: { src: string; type?: "hls" | "mp4" }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setError("");
    const showError = () => setError("This video source could not be played in this browser. Try another source or open it directly.");
    video.addEventListener("error", showError);

    if (type === "mp4" || video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return () => { video.removeEventListener("error", showError); video.removeAttribute("src"); video.load(); };
    }
    if (!Hls.isSupported()) {
      video.src = src;
      return () => { video.removeEventListener("error", showError); video.removeAttribute("src"); video.load(); };
    }

    const hls = new Hls({ enableWorker: true, capLevelToPlayerSize: true, maxBufferLength: 30 });
    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        setError("The stream stopped unexpectedly. Try another source or reload this episode.");
        hls.destroy();
      }
    });
    hls.loadSource(src);
    hls.attachMedia(video);
    return () => { video.removeEventListener("error", showError); hls.destroy(); };
  }, [src, type]);

  return <div className="w-full">
    <video ref={videoRef} controls playsInline preload="metadata" className="aspect-video h-auto max-h-[80vh] w-full bg-black object-contain" />
    {error && <p role="status" className="mt-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error} <a href={src} target="_blank" rel="noopener noreferrer" className="font-semibold underline">Open source</a></p>}
  </div>;
}
