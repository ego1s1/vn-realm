import { NextRequest, NextResponse } from "next/server";

const VNDB_API = "https://api.vndb.org/kana/release";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const normalized = params.id.startsWith("v") ? params.id : `v${params.id}`;

  try {
    const response = await fetch(`${VNDB_API}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        filters: ["vn", "=", ["id", "=", normalized]],
        fields: "id,title,languages,platforms,official,freeware,patch,released,extlinks{url,label}",
        results: 50
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      return NextResponse.json({ releases: [] });
    }

    const data = await response.json();
    const releases =
      data?.results?.map((release: any) => ({
        id: release.id,
        title: release.title,
        languages: release.languages?.map((lang: any) => lang.lang || lang) || [],
        platforms: release.platforms || [],
        official: release.official,
        freeware: release.freeware,
        patch: release.patch,
        released: release.released,
        extlinks: release.extlinks || []
      })) ?? [];

    return NextResponse.json({ releases });
  } catch (error) {
    console.error("Error fetching releases:", error);
    return NextResponse.json({ releases: [] });
  }
}

