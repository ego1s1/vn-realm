import { NextRequest, NextResponse } from "next/server";

const TORRENTS_CSV_URL = "https://torrents-csv.com/service/search";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const response = await fetch(`${TORRENTS_CSV_URL}?q=${encodeURIComponent(query)}&size=10`, {
      headers: {
        "Accept": "application/json"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = await response.json();
    const results = data?.torrents || [];

    function formatSize(bytes: number): string {
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    }

    return NextResponse.json({
      results: results.map((torrent: any) => ({
        name: torrent.name,
        magnet: torrent.infohash ? `magnet:?xt=urn:btih:${torrent.infohash}` : null,
        size: torrent.size_bytes ? formatSize(torrent.size_bytes) : undefined,
        seeders: torrent.seeders,
        leechers: torrent.leechers
      })).filter((t: any) => t.magnet)
    });
  } catch (error) {
    console.error("Torrent search error:", error);
    return NextResponse.json({ results: [] });
  }
}

