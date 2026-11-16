import type { AnimeProvider } from "./types";

// Providers are deliberately registered only after their real response shape is verified.
export const providers: AnimeProvider[] = [];

export function getProvider(id: string): AnimeProvider | undefined {
  return providers.find((provider) => provider.id === id);
}
