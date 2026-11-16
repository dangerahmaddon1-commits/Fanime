"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";

export default function HlsPlayer({ src, type = "hls" }: { src: string; type?: "hls" | "mp4" }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (type === "mp4" || video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return;
    }
    if (!Hls.isSupported()) {
      video.src = src;
      return;
    }
    const hls = new Hls({ enableWorker: false });
    hls.loadSource(src);
    hls.attachMedia(video);
    return () => hls.destroy();
  }, [src, type]);

  return <video ref={videoRef} controls playsInline preload="metadata" className="h-full w-full bg-black" />;
}
