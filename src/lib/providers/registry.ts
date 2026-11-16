import { getRenimeProviderOrder } from "./provider-order";
import type { AnimeProvider } from "./types";

const apiBaseUrl = process.env.RENIME_API_BASE_URL?.trim();

export const providers: AnimeProvider[] = getRenimeProviderOrder(apiBaseUrl);

export function getProvider(id: string): AnimeProvider | undefined {
  return providers.find((provider) => provider.id === id);
}
