# F Anime

F Anime is an orange-accented anime discovery experience built with Next.js 15, TypeScript and Tailwind CSS. The app is configured for Cloudflare Workers using OpenNext.

## Stack
- Next.js 15 App Router + TypeScript
- Tailwind CSS 4
- Cloudflare Workers + `@opennextjs/cloudflare`
- AniList GraphQL for general anime metadata and airing schedules
- Optional Renime API adapter for AnimeSalt and WatchAnimeWorld catalogs, episode details and provider-supplied embeds
- Optional Anivexa adapter for multi-provider SUB/DUB episode availability and watch-source lookup
- Firebase Web SDK for optional browser analytics; authentication is not enabled in the app yet
- Neon Postgres + Drizzle and account features are planned, not yet connected

## Local setup
1. Use Node.js 22.12 or newer (required by the current Wrangler toolchain).
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Run `npm run dev`.

## Optional Renime API
Set `RENIME_DEFAULT_PROVIDER` to `animesalt` or `watchanimeworld`. If `RENIME_API_BASE_URL` is blank, F Anime uses its built-in direct adapters based on the supplied Renime-API repository and requests the public AnimeSalt / WatchAnimeWorld catalog pages using HTTPS fetch + Cheerio. If you have a separately hosted Renime API, set `RENIME_API_BASE_URL` to its base URL (without `/api` at the end) to use that JSON API instead.

Set `ANIVEXA_API_BASE_URL` to a running Anivexa API instance (without a trailing slash) to enable its aggregated provider episode lists and SUB/DUB watch-source lookup. Anivexa's supplied repository is a self-hosted Node.js API and does not publish a verified public API base URL. Its `wreq-js` dependency uses platform-specific native bindings, so the API server needs a compatible Node.js host; it cannot be assumed to run unchanged on Cloudflare Workers. The F Anime adapter only calls its public JSON endpoints.

When the Renime API is configured, F Anime tries it for provider search, title details, episodes and embed server lists. If provider search is unavailable, search falls back to AniList. General anime details and the weekly airing schedule use AniList.

The previously tested `renime.top` API routes returned HTTP 404. The built-in direct adapters therefore do not depend on that host. They may still be blocked by upstream anti-bot rules; if that happens, search and metadata fall back to AniList, and playback remains unavailable until a provider endpoint is reachable. The selectors and endpoint behavior are adapted from the supplied Renime-API repository (ISC, Dark & Pyro Team).

## Firebase analytics

The Firebase web app configuration supplied for project `fanime-c94fe` is wired into the client initializer. Optional `NEXT_PUBLIC_FIREBASE_*` variables can override those defaults in local or Cloudflare environments. These configuration values are browser-visible identifiers, not server secrets; secure Firebase services with Firebase Security Rules. Firebase Analytics initializes only in supported browsers and is optional, so it will not block rendering. Authentication is not wired up yet.

## SEO and search indexing

Set `NEXT_PUBLIC_SITE_URL` to the exact public origin after the Cloudflare Workers hostname or custom domain is known (for example, `https://your-real-hostname`). This value powers canonical metadata, `robots.txt` sitemap discovery and `sitemap.xml`. The sitemap lists the public landing, catalog, discovery and schedule routes; anime detail pages generate title, description and social metadata dynamically. Do not guess this URL before the production hostname exists.

## Cloudflare
Run `npx opennextjs-cloudflare build` to build the Worker. `npm run build` runs the underlying Next.js build; `npm run preview` builds the Worker and starts the local Workers preview. Deploy with `npm run deploy` only after the account, bindings and environment variables have been configured and reviewed. This project uses Cloudflare Workers, not Vercel or static Pages export.

## Current implementation
- Orange F Anime branding and responsive homepage
- Anime search with AniList fallback and optional Renime provider search
- Anime detail pages with Renime season/episode data and deduplicated Anivexa multi-provider SUB/DUB episode availability when configured
- Weekly airing schedule with a date strip, displayed in Pakistan time
- Watch pages with provider fallback, HTTPS iframe embeds and HLS.js playback when Anivexa is configured

## Not connected yet
Authentication, user profiles, watch history, Neon database, Monetag, ad-block messaging, automatic daily provider health checks, full watch-page utilities, user watch history, and production playback verification are not implemented yet. No deployment has been performed.
