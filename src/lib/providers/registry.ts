import type { AnimeProvider } from "./types";
import { RenimeApiProvider } from "./renime-api";

const apiBaseUrl = process.env.RENIME_API_BASE_URL?.trim();

// Register the two independent upstream catalogs only when a self-hosted
// Renime API URL has been configured. Both normalize into the same contract.
export const providers: AnimeProvider[] = apiBaseUrl
  ? [new RenimeApiProvider(apiBaseUrl, "animesalt"), new RenimeApiProvider(apiBaseUrl, "watchanimeworld")]
  : [];

export function getProvider(id: string): AnimeProvider | undefined {
  return providers.find((provider) => provider.id === id);
}
