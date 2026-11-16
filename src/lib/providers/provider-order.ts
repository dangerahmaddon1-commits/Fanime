import { RenimeApiProvider } from "./renime-api";
import { DirectRenimeProvider } from "./direct-renime";
import type { AnimeProvider } from "./types";

export function getRenimeProviderOrder(baseUrl?: string): AnimeProvider[] {
  const preferred = process.env.RENIME_DEFAULT_PROVIDER === "watchanimeworld" ? "watchanimeworld" : "animesalt";
  const alternate = preferred === "animesalt" ? "watchanimeworld" : "animesalt";
  if (baseUrl?.trim()) {
    return [
      new RenimeApiProvider(baseUrl, preferred),
      new RenimeApiProvider(baseUrl, alternate),
    ];
  }
  return [
    new DirectRenimeProvider(preferred),
    new DirectRenimeProvider(alternate),
  ];
}
