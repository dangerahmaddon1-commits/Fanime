import { NextRequest, NextResponse } from "next/server";

const ANILIST_URL = "https://graphql.anilist.co";

async function queryAniList(query: string, variables: Record<string, unknown>) {
  const response = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`AniList returned HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.errors?.length) throw new Error(payload.errors[0]?.message ?? "AniList query failed");
  return payload.data;
}

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("mode") ?? "search";
  try {
    if (mode === "schedule") {
      const now = Math.floor(Date.now() / 1000);
      const data = await queryAniList(`
        query ($start: Int!, $end: Int!) {
          Page(page: 1, perPage: 50) {
            airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
              id airingAt episode media {
                id title { romaji english native }
                coverImage { large }
                format seasonYear
              }
            }
          }
        }`, { start: now, end: now + 7 * 24 * 60 * 60 });
      return NextResponse.json({ items: data.Page.airingSchedules });
    }
    const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (!q) return NextResponse.json({ items: [] });
    const data = await queryAniList(`
      query ($search: String!) {
        Page(page: 1, perPage: 24) {
          media(search: $search, type: ANIME, isAdult: false, sort: [SEARCH_MATCH]) {
            id title { romaji english native }
            coverImage { large }
            bannerImage
            description(asHtml: false)
            episodes seasonYear format status averageScore genres
          }
        }
      }`, { search: q });
    return NextResponse.json({ items: data.Page.media });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Anime service unavailable" }, { status: 502 });
  }
}
