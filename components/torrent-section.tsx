"use client";

import { useEffect, useState } from "react";
import styles from "./torrent-section.module.css";

type Torrent = {
  name: string;
  magnet: string;
  size?: string;
  seeders?: number;
  leechers?: number;
};

export default function TorrentSection({ query }: { query: string }) {
  const [torrents, setTorrents] = useState<Torrent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query || query.length < 2) {
      setLoading(false);
      return;
    }

    fetch(`/api/torrents?q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => {
        setTorrents(data?.results ?? []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching torrents:", error);
        setLoading(false);
      });
  }, [query]);

  if (loading || torrents.length === 0) {
    return null;
  }

  return (
    <section className={styles.section}>
      <h2>Torrents</h2>
      <div className={styles.torrentList}>
        {torrents.map((torrent, index) => (
          <div key={index} className={styles.torrentItem}>
            <div>
              <strong>{torrent.name}</strong>
              <div className={styles.torrentMeta}>
                {torrent.size ? <span>Size: {torrent.size}</span> : null}
                {torrent.seeders !== undefined ? <span>Seeders: {torrent.seeders}</span> : null}
                {torrent.leechers !== undefined ? <span>Leechers: {torrent.leechers}</span> : null}
              </div>
            </div>
            <a href={torrent.magnet} className={styles.magnetLink}>
              Magnet Link
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

