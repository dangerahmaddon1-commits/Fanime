import { RenimeApiProvider } from "./renime-api";

export function getRenimeProviderOrder(baseUrl: string): RenimeApiProvider[] {
  const preferred = process.env.RENIME_DEFAULT_PROVIDER === "watchanimeworld" ? "watchanimeworld" : "animesalt";
  const alternate = preferred === "animesalt" ? "watchanimeworld" : "animesalt";
  return [
    new RenimeApiProvider(baseUrl, preferred),
    new RenimeApiProvider(baseUrl, alternate),
  ];
}
