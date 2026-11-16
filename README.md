# F Anime

F Anime is an orange-accented anime discovery experience built with Next.js 15, TypeScript and Tailwind CSS. The app is configured for Cloudflare Workers using OpenNext.

## Stack
- Next.js 15 App Router + TypeScript
- Tailwind CSS 4
- Cloudflare Workers + `@opennextjs/cloudflare`
- AniList GraphQL for general anime metadata and airing schedules
- Optional Renime API adapter for AnimeSalt and WatchAnimeWorld catalogs, episode details and provider-supplied embeds
- Neon Postgres + Drizzle and account features are planned, not yet connected

## Local setup
1. Use Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Run `npm run dev`.

## Optional Renime API
Set `RENIME_API_BASE_URL` to the base URL of a running Renime API instance (for example, the URL of your own deployment, without `/api` at the end). Set `RENIME_DEFAULT_PROVIDER` to `animesalt` or `watchanimeworld`.

When the Renime API is configured, F Anime tries it for provider search, title details, episodes and embed server lists. If provider search is unavailable, search falls back to AniList. General anime details and the weekly airing schedule use AniList.

The public `renime.top` address previously checked returned HTTP 404 for the tested API routes, so it is not configured as a working API host. The adapter follows the endpoints and response structures in the supplied Renime-API repository; a running instance still needs to be configured and tested.

## Cloudflare
Run `npm run build` to build the OpenNext Worker and `npm run preview` to preview it. Deploy with `npm run deploy` only after the account, bindings and environment variables have been configured and reviewed. This project uses Cloudflare Workers, not Vercel or static Pages export.

## Current implementation
- Orange F Anime branding and responsive homepage
- Anime search with AniList fallback and optional Renime provider search
- Anime detail pages, including provider episode lists when Renime is configured
- Weekly airing schedule displayed in Pakistan time
- Watch page with provider-returned HTTPS iframe servers when Renime is configured

## Not connected yet
Authentication, user profiles, watch history, Neon database, Monetag, ad-block messaging, automatic provider health checks/failover, and production playback verification are not implemented yet. No deployment has been performed.
