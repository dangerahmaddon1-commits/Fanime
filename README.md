# Fanime

A dark, red-accented anime discovery interface built with Next.js 15, TypeScript and Tailwind CSS. The starter is designed for Cloudflare Workers using OpenNext, Neon Postgres with Drizzle, and HLS.js.

## Stack
- Next.js 15 App Router + TypeScript
- Tailwind CSS 4
- Cloudflare Workers + `@opennextjs/cloudflare`
- Neon Postgres + Drizzle ORM (schema and connection setup to follow)
- HLS.js for authorized HLS playback

## Local setup
1. Install Node.js 20. `npm install`
2. Copy `.env.example` to `.env.local` and fill in values when services are configured.
3. Run `npm run dev`.

## Cloudflare
Run `npm run preview` to build and preview the OpenNext Worker. Deploy with `npm run deploy` after configuring Wrangler and Cloudflare. This uses Cloudflare Workers, not Vercel or Pages static export.

## Current scope
This is the application foundation only. No third-party provider is enabled until its API response and permitted playback behavior are verified. The Worker is an allowlisted proxy for media sources you are authorized to access; it is not a general-purpose proxy.
