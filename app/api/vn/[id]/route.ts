import { NextRequest, NextResponse } from "next/server";

const VNDB_API = "https://api.vndb.org/kana/vn";

const DETAIL_FIELDS =
  "id,title,aliases,alttitle,olang,description,released,length,length_minutes,average,rating,votecount,languages,platforms,devstatus,image.url,image.thumbnail,screenshots.url,screenshots.thumbnail,tags{name,description,category,spoiler,rating},extlinks{url,label},relations{id,title,relation,relation_official},developers{name,id},staff{id,role,note},va{note,staff{id,name},character{id,name}}";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const normalized = params.id.startsWith("v") ? params.id : `v${params.id}`;

  try {
    const response = await fetch(`${VNDB_API}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        filters: ["id", "=", normalized],
        fields: DETAIL_FIELDS,
        results: 1
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const data = await response.json();
    return NextResponse.json(data?.results?.[0] ?? null);
  } catch (error) {
    console.error("Error fetching VN:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

