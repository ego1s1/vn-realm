import { NextRequest, NextResponse } from "next/server";

const VNDB_API = "https://api.vndb.org/kana/vn";

const BASE_FIELDS = "id,title,aliases,description,released,image.url,image.thumbnail,length_minutes,average,votecount,platforms,languages";

const DETAIL_FIELDS =
  "tags.name,tags.spoiler,tags.rating,extlinks.url,extlinks.label,releases.id,releases.title,releases.languages,releases.extlinks.url,releases.extlinks.label";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const limit = Math.min(Number(searchParams.get("limit") ?? 9), 20);

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const payload = {
    filters: ["search", "=", query],
    fields: BASE_FIELDS,
    sort: "searchrank",
    results: limit
  };

  const response = await fetch(VNDB_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Upstream error" }, { status: response.status });
  }

  const data = await response.json();
  const baseResults: any[] = data?.results ?? [];

  const detailMap = new Map<
    string,
    {
      tags?: { name?: string; rating?: number; spoiler?: number }[];
      extlinks?: { url?: string; label?: string }[];
      releases?: { id?: string; title?: string; languages?: string[]; extlinks?: { url?: string; label?: string }[] }[];
    }
  >();

  if (baseResults.length) {
    const filters =
      baseResults.length === 1
        ? ["id", "=", baseResults[0].id]
        : ["or", ...baseResults.map((item) => ["id", "=", item.id])];

    const detailResponse = await fetch(VNDB_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        filters,
        fields: DETAIL_FIELDS,
        results: baseResults.length
      }),
      cache: "no-store"
    });

    if (detailResponse.ok) {
      const detailData = await detailResponse.json();
      detailData?.results?.forEach((entry: any) => {
        detailMap.set(entry.id, {
          tags: entry.tags,
          extlinks: entry.extlinks,
          releases: entry.releases
        });
      });
    }
  }

  const transformed = baseResults.map((item: any) => {
    const detail = detailMap.get(item.id);
    return {
      id: item.id,
      title: item.title,
      aliases: item.aliases,
      description: item.description,
      released: item.released,
      image: item.image?.thumbnail ?? item.image?.url,
      rating: item.average,
      votecount: item.votecount,
      lengthMinutes: item.length_minutes,
      platforms: item.platforms,
      languages: item.languages,
      tags:
        detail?.tags?.map((tag: any) => ({
          name: tag.name,
          score: tag.rating,
          spoiler: tag.spoiler
        })) ?? [],
      extlinks:
        detail?.extlinks?.map((link: any) => ({
          url: link.url,
          label: link.label
        })) ?? [],
      releases:
        detail?.releases?.map((release: any) => ({
          id: release.id,
          title: release.title,
          languages: release.languages,
          extlinks:
            release.extlinks?.map((link: any) => ({
              url: link.url,
              label: link.label
            })) ?? []
        })) ?? []
    };
  });

  return NextResponse.json({ results: transformed });
}

