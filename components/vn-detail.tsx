"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styles from "./vn-detail.module.css";
import TorrentSection from "@/components/torrent-section";

type DetailEntry = {
  id: string;
  title: string;
  aliases?: string[];
  alttitle?: string | null;
  olang?: string | null;
  description?: string | null;
  released?: string | null;
  length?: number | null;
  length_minutes?: number | null;
  average?: number | null;
  rating?: number | null;
  votecount?: number | null;
  languages?: string[];
  platforms?: string[];
  devstatus?: number | null;
  image?: {
    url?: string;
    thumbnail?: string;
  };
  tags?: {
    name?: string;
    rating?: number;
    spoiler?: number;
    category?: string;
  }[];
  extlinks?: {
    url?: string;
    label?: string;
  }[];
  relations?: {
    id?: string;
    title?: string;
    relation?: string;
    relation_official?: boolean;
  }[];
  developers?: {
    id?: string;
    name?: string;
  }[];
  releases?: {
    id?: string;
    title?: string;
    languages?: string[];
    platforms?: string[];
    official?: boolean;
    freeware?: boolean;
    patch?: boolean;
    released?: string;
    extlinks?: {
      url?: string;
      label?: string;
    }[];
  }[];
};

function parseBbcodeLinks(text: string): string {
  return text.replace(/\[url=([^\]]+)\]([^\[]+)\[\/url\]/gi, (match, url, linkText) => {
    const escapedUrl = url.replace(/"/g, "&quot;");
    const escapedText = linkText.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<a href="${escapedUrl}" target="_blank" rel="noreferrer">${escapedText}</a>`;
  });
}

function sanitize(description?: string | null) {
  if (!description) {
    return "No synopsis available.";
  }
  let processed = description.replace(/(<([^>]+)>)/gi, " ").replace(/\s+/g, " ").trim();
  processed = parseBbcodeLinks(processed);
  return processed;
}

function formatRating(value?: number | null, votes?: number | null) {
  if (!value || !votes) {
    return "No rating";
  }
  return `${(value / 10).toFixed(1)} • ${votes.toLocaleString()} votes`;
}

function SkeletonText({ width = "100%", height = "1rem" }: { width?: string; height?: string }) {
  return <div className={styles.skeleton} style={{ width, height }} />;
}

function SkeletonBox({ width = "100%", height = "200px", style }: { width?: string; height?: string; style?: React.CSSProperties }) {
  return <div className={styles.skeletonBox} style={{ width, height, ...style }} />;
}

export default function VnDetail({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const [vn, setVn] = useState<DetailEntry | null>(null);
  const [releases, setReleases] = useState<DetailEntry["releases"]>([]);
  const [loading, setLoading] = useState(true);
  const [releasesLoading, setReleasesLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const queryParam = (() => {
    const query = searchParams.get("q");
    return query ? `?q=${encodeURIComponent(query)}` : "";
  })();
  const backUrl = queryParam ? `/${queryParam}` : "/";

  useEffect(() => {
    const normalized = id.startsWith("v") ? id : `v${id}`;
    
    Promise.all([
      fetch(`/api/vn/${normalized}`)
        .then(async (res) => {
          if (res.status === 404) {
            setError(true);
            setLoading(false);
            return null;
          }
          if (!res.ok) {
            throw new Error(`Failed to fetch: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (data === null) {
            return;
          }
          if (!data || !data.id) {
            setError(true);
            setLoading(false);
            return;
          }
          setVn(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching VN:", err);
          setError(true);
          setLoading(false);
        }),
      fetch(`/api/vn/${normalized}/releases`)
        .then((res) => res.json())
        .then((data) => {
          setReleases(data.releases || []);
          setReleasesLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching releases:", err);
          setReleasesLoading(false);
        })
    ]);
  }, [id]);

  if (error) {
    return (
      <main className={styles.main}>
        <Link href={backUrl} className={styles.backLink}>
          ← Back to search
        </Link>
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <h1>Visual Novel not found</h1>
          <p style={{ color: "rgba(255, 255, 255, 0.6)", marginTop: "16px" }}>
            The visual novel you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </main>
    );
  }

  const filteredTags = (vn?.tags ?? [])
    .filter((tag) => !tag.spoiler)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 12);

  const relationList = vn?.relations ?? [];

  return (
    <main className={styles.main}>
      <Link href={backUrl} className={styles.backLink}>
        ← Back to search
      </Link>
      <section className={styles.hero}>
        {loading ? (
          <SkeletonBox width="100%" height="auto" style={{ aspectRatio: "2/3" }} />
        ) : vn?.image?.url ? (
          <div className={`${styles.cover} ${styles.fadeIn}`}>
            <Image src={vn.image.url} alt={vn.title} fill priority sizes="320px" />
          </div>
        ) : null}
        <div className={styles.heroText}>
          <div className={styles.metrics}>
            {loading ? (
              <>
                <SkeletonText width="60px" />
                <SkeletonText width="100px" />
                <SkeletonText width="120px" />
              </>
            ) : (
              <>
                <span>{vn?.id}</span>
                {vn?.olang ? <span>Origin: {vn.olang.toUpperCase()}</span> : null}
                {vn?.released ? <span>Released: {vn.released}</span> : null}
                {vn?.length_minutes ? <span>{Math.round(vn.length_minutes / 60)}h avg</span> : null}
                {vn?.length ? <span>Length tier {vn.length}</span> : null}
              </>
            )}
          </div>
          {loading ? (
            <>
              <SkeletonText width="80%" height="2.5rem" />
              <SkeletonText width="60%" height="1.2rem" />
            </>
          ) : (
            <>
              <h1 className={styles.fadeIn}>{vn?.title}</h1>
              {vn?.aliases?.length ? (
                <p className={`${styles.aliases} ${styles.fadeIn}`}>{vn.aliases.join(" • ")}</p>
              ) : null}
            </>
          )}
          <div className={styles.metrics}>
            {loading ? (
              <SkeletonText width="150px" />
            ) : (
              <>
                <span className={styles.rating}>{formatRating(vn?.rating, vn?.votecount)}</span>
                {vn?.platforms?.length ? <span>Platforms: {vn.platforms.join(", ")}</span> : null}
                {vn?.languages?.length ? <span>Languages: {vn.languages.join(", ")}</span> : null}
              </>
            )}
          </div>
          {loading ? (
            <>
              <SkeletonText height="1rem" />
              <SkeletonText height="1rem" />
              <SkeletonText width="90%" height="1rem" />
            </>
          ) : (
            <p className={`${styles.description} ${styles.fadeIn}`} dangerouslySetInnerHTML={{ __html: sanitize(vn?.description) }} />
          )}
        </div>
      </section>
      <section className={styles.grid}>
        {loading ? (
          <div className={styles.panel}>
            <SkeletonText width="80px" height="1.5rem" />
            <div className={styles.list}>
              {[...Array(6)].map((_, i) => (
                <SkeletonText key={i} width="80px" height="2rem" />
              ))}
            </div>
          </div>
        ) : filteredTags.length ? (
          <div className={`${styles.panel} ${styles.fadeIn}`}>
            <h2>Tags</h2>
            <div className={styles.list}>
              {filteredTags.map(
                (tag) =>
                  tag?.name && (
                    <span key={tag.name} className={styles.tag}>
                      {tag.name}
                    </span>
                  )
              )}
            </div>
          </div>
        ) : null}
        {loading ? (
          <div className={styles.panel}>
            <SkeletonText width="120px" height="1.5rem" />
            <div className={styles.links}>
              {[...Array(3)].map((_, i) => (
                <SkeletonText key={i} width="150px" height="1.2rem" />
              ))}
            </div>
          </div>
        ) : vn?.extlinks?.length ? (
          <div className={`${styles.panel} ${styles.fadeIn}`}>
            <h2>External Links</h2>
            <div className={styles.links}>
              {vn.extlinks.map(
                (link, index) =>
                  link?.url && (
                    <a key={`${link.url}-${index}`} href={link.url} target="_blank" rel="noreferrer">
                      {link.label || link.url}
                    </a>
                  )
              )}
            </div>
          </div>
        ) : null}
        {loading ? (
          <div className={styles.panel}>
            <SkeletonText width="100px" height="1.5rem" />
            <div className={styles.list}>
              {[...Array(2)].map((_, i) => (
                <SkeletonText key={i} width="120px" height="2rem" />
              ))}
            </div>
          </div>
        ) : vn?.developers?.length ? (
          <div className={`${styles.panel} ${styles.fadeIn}`}>
            <h2>Developers</h2>
            <div className={styles.list}>
              {vn.developers.map(
                (dev) =>
                  dev?.name && (
                    <span key={dev.id ?? dev.name} className={styles.tag}>
                      {dev.name}
                    </span>
                  )
              )}
            </div>
          </div>
        ) : null}
      </section>
      {releasesLoading ? (
        <section className={styles.section}>
          <SkeletonText width="100px" height="1.5rem" />
          <div className={styles.releaseList}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className={styles.releaseCard}>
                <SkeletonText width="60%" height="1.2rem" />
                <div className={styles.releaseMeta}>
                  <SkeletonText width="80px" />
                  <SkeletonText width="100px" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : releases && releases.length ? (
        <section className={`${styles.section} ${styles.fadeIn}`}>
          <h2>Releases</h2>
          <div className={styles.releaseList}>
            {releases.map(
              (release) =>
                release?.title && (
                  <div key={release.id ?? release.title} className={styles.releaseCard}>
                    <strong>{release.title}</strong>
                    <div className={styles.releaseMeta}>
                      {release.languages?.length ? <span>{release.languages.join(", ")}</span> : null}
                      {release.platforms?.length ? <span>{release.platforms.join(", ")}</span> : null}
                      {release.released ? <span>{release.released}</span> : null}
                      {release.official !== undefined ? <span>{release.official ? "Official" : "Unofficial"}</span> : null}
                      {release.patch ? <span>Patch</span> : null}
                      {release.freeware ? <span>Freeware</span> : null}
                    </div>
                    <div className={styles.releaseLinks}>
                      {release.id ? (
                        <a href={`https://vndb.org/${release.id}`} target="_blank" rel="noreferrer">
                          View on VNDB
                        </a>
                      ) : null}
                      {release.extlinks?.map(
                        (link, index) =>
                          link?.url && (
                            <a key={`${link.url}-${index}`} href={link.url} target="_blank" rel="noreferrer">
                              {link.label || "External"}
                            </a>
                          )
                      )}
                    </div>
                  </div>
                )
            )}
          </div>
        </section>
      ) : null}
      {loading ? (
        <section className={styles.section}>
          <SkeletonText width="100px" height="1.5rem" />
          <div className={styles.relations}>
            {[...Array(2)].map((_, i) => (
              <div key={i} className={styles.relationItem}>
                <SkeletonText width="200px" height="1.2rem" />
                <SkeletonText width="100px" height="1rem" />
              </div>
            ))}
          </div>
        </section>
      ) : relationList.length ? (
        <section className={`${styles.section} ${styles.fadeIn}`}>
          <h2>Relations</h2>
          <div className={styles.relations}>
            {relationList.map(
              (relation) =>
                relation?.title && (
                  <div key={relation.id ?? relation.title} className={styles.relationItem}>
                    {relation.id ? <Link href={`/vn/${relation.id}${queryParam}`}>{relation.title}</Link> : <span>{relation.title}</span>}
                    <div className={styles.releaseMeta}>
                      <span>{relation.relation}</span>
                      {relation.relation_official !== undefined ? <span>{relation.relation_official ? "Official" : "Unofficial"}</span> : null}
                    </div>
                  </div>
                )
            )}
          </div>
        </section>
      ) : null}
      {vn && <TorrentSection query={vn.title} />}
    </main>
  );
}

