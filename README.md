# F Anime

F Anime is an orange-accented anime discovery experience built with Next.js 15, TypeScript and Tailwind CSS. The app is configured for Cloudflare Workers using OpenNext.

## Stack
- Next.js 15 App Router + TypeScript
- Tailwind CSS 4
- Cloudflare Workers + `@opennextjs/cloudflare`
- AniList GraphQL for general anime metadata and airing schedules
- Optional Renime API adapter for AnimeSalt and WatchAnimeWorld catalogs, episode details and provider-supplied embeds
- Optional Anivexa adapter for multi-provider SUB/DUB episode availability and watch-source lookup
- Neon Postgres + Drizzle and account features are planned, not yet connected

## Local setup
1. Use Node.js 22.12 or newer (required by the current Wrangler toolchain).
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Run `npm run dev`.

## Optional Renime API
Set `RENIME_API_BASE_URL` to the base URL of a running Renime API instance (without `/api` at the end). Set `RENIME_DEFAULT_PROVIDER` to `animesalt` or `watchanimeworld`.

Set `ANIVEXA_API_BASE_URL` to a running Anivexa API instance (without a trailing slash) to enable its aggregated provider episode lists and SUB/DUB watch-source lookup. Anivexa's supplied repository is a self-hosted Node.js API and does not publish a verified public API base URL. Its `wreq-js` dependency uses platform-specific native bindings, so the API server needs a compatible Node.js host; it cannot be assumed to run unchanged on Cloudflare Workers. The F Anime adapter only calls its public JSON endpoints.

When the Renime API is configured, F Anime tries it for provider search, title details, episodes and embed server lists. If provider search is unavailable, search falls back to AniList. General anime details and the weekly airing schedule use AniList.

The public `renime.top` address previously checked returned HTTP 404 for the tested API routes, so it is not configured as a working API host. The adapter follows the endpoints and response structures in the supplied Renime-API repository; a running instance still needs to be configured and tested.

## Cloudflare
Run `npm run build` to build the OpenNext Worker and `npm run preview` to preview it. Deploy with `npm run deploy` only after the account, bindings and environment variables have been configured and reviewed. This project uses Cloudflare Workers, not Vercel or static Pages export.

## Current implementation
- Orange F Anime branding and responsive homepage
- Anime search with AniList fallback and optional Renime provider search
- Anime detail pages with Renime season/episode data and deduplicated Anivexa multi-provider SUB/DUB episode availability when configured
- Weekly airing schedule with a date strip, displayed in Pakistan time
- Watch pages with provider fallback, HTTPS iframe embeds and HLS.js playback when Anivexa is configured

## Not connected yet
Authentication, user profiles, watch history, Neon database, Monetag, ad-block messaging, automatic daily provider health checks, full watch-page utilities, user watch history, and production playback verification are not implemented yet. No deployment has been performed.
