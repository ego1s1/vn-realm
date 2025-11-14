"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./search-panel.module.css";

type VnResult = {
  id: string;
  title: string;
  aliases?: string[];
  description?: string;
  released?: string;
  rating?: number | null;
  votecount?: number | null;
  lengthMinutes?: number | null;
  languages?: string[];
  platforms?: string[];
};

type SearchState = {
  status: "idle" | "loading" | "ready" | "error";
  message?: string;
};

const MIN_QUERY = 2;

export default function SearchPanel() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VnResult[]>([]);
  const [{ status, message }, setState] = useState<SearchState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();

  const canSearch = query.trim().length >= MIN_QUERY;

  const performSearch = useCallback(() => {
    if (!canSearch) {
      return;
    }

    const trimmedQuery = query.trim();
    const params = new URLSearchParams();
    params.set("q", trimmedQuery);
    router.push(`/?${params.toString()}`, { scroll: false });

    const controller = new AbortController();
    setState({ status: "loading" });

    startTransition(() => {
      fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}&limit=9`, {
        signal: controller.signal
      })
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(`Request failed with ${res.status}`);
          }
          return res.json();
        })
        .then((payload) => {
          setResults(payload.results ?? []);
          setState({
            status: "ready",
            message: payload.results?.length ? undefined : "No visual novels found."
          });
        })
        .catch((err) => {
          if (err.name === "AbortError") {
            return;
          }
          setState({ status: "error", message: "Something went wrong. Try again." });
        });
    });

    return () => {
      controller.abort();
    };
  }, [canSearch, query, router, startTransition]);

  // Initialize from URL on mount or when URL changes (but don't interfere with typing)
  useEffect(() => {
    const urlQuery = searchParams.get("q");
    const trimmedUrlQuery = urlQuery?.trim() || "";
    
    // Only sync from URL if URL has a query and it's different from current query
    // This prevents clearing the input while user is typing
    if (trimmedUrlQuery.length >= MIN_QUERY) {
      // Only update query if URL query is different (user navigated back/forward)
      setQuery((currentQuery) => {
        if (currentQuery.trim() !== trimmedUrlQuery) {
          return trimmedUrlQuery;
        }
        return currentQuery;
      });
      
      // Only fetch if we don't have results yet
      if (results.length === 0 && status === "idle") {
        const controller = new AbortController();
        setState({ status: "loading" });

        startTransition(() => {
          fetch(`/api/search?q=${encodeURIComponent(trimmedUrlQuery)}&limit=9`, {
            signal: controller.signal
          })
            .then(async (res) => {
              if (!res.ok) {
                throw new Error(`Request failed with ${res.status}`);
              }
              return res.json();
            })
            .then((payload) => {
              setResults(payload.results ?? []);
              setState({
                status: "ready",
                message: payload.results?.length ? undefined : "No visual novels found."
              });
            })
            .catch((err) => {
              if (err.name === "AbortError") {
                return;
              }
              setState({ status: "error", message: "Something went wrong. Try again." });
            });
        });

        return () => {
          controller.abort();
        };
      }
    } else if (!urlQuery && results.length > 0) {
      // Only clear if URL is explicitly cleared (e.g., back button) and we have results
      setQuery("");
      setResults([]);
      setState({ status: "idle" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" && canSearch) {
        performSearch();
      }
    },
    [canSearch, performSearch]
  );

  const placeholder = useMemo(
    () => ["Steins;Gate", "Ever17", "Fate/stay night", "White Album 2"][Math.floor(Math.random() * 4)],
    []
  );

  const parseBbcodeLinks = useCallback((text: string): string => {
    return text.replace(/\[url=([^\]]+)\]([^\[]+)\[\/url\]/gi, (match, url, linkText) => {
      const escapedUrl = url.replace(/"/g, "&quot;");
      const escapedText = linkText.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `<a href="${escapedUrl}" target="_blank" rel="noreferrer">${escapedText}</a>`;
    });
  }, []);

  const formatDescription = useCallback((desc?: string) => {
    if (!desc) {
      return "No synopsis available.";
    }
    let processed = desc.replace(/(<([^>]+)>)/gi, " ");
    const needsTruncation = processed.length > 160;
    if (needsTruncation) {
      processed = processed.slice(0, 160).trim() + "…";
    }
    processed = parseBbcodeLinks(processed);
    return processed.trim();
  }, [parseBbcodeLinks]);

  const formatRating = useCallback((value?: number | null, votes?: number | null) => {
    if (!value || !votes) {
      return "Unscored";
    }
    return `${(value / 10).toFixed(1)} • ${votes.toLocaleString()} votes`;
  }, []);

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <h1>VN Realm</h1>
        <p>Find VN information along with sailing the seven seas</p>
      </header>
      <div className={styles.inputWrap}>
        <input
          className={styles.input}
          placeholder={`Search "${placeholder}"`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <div className={styles.hint}>
          {status === "loading" || isPending ? "Searching…" : canSearch ? "Press Enter to search" : "Type at least 2 characters, then press Enter"}
        </div>
      </div>
      {message && status !== "loading" && <div className={styles.message}>{message}</div>}
      <div className={styles.results}>
        {results.map((vn) => {
          const urlQuery = searchParams.get("q");
          const queryParam = urlQuery ? `?q=${encodeURIComponent(urlQuery)}` : "";
          return (
          <article key={vn.id} className={styles.card}>
            <Link href={`/vn/${vn.id}${queryParam}`} className={styles.cardLink}>
              <div className={styles.summary}>
                <div>
                  <h3>{vn.title}</h3>
                  {vn.aliases?.length ? <p className={styles.aliases}>{vn.aliases.slice(0, 2).join(" • ")}</p> : null}
                </div>
                <span className={styles.rating}>{formatRating(vn.rating, vn.votecount)}</span>
              </div>
              <div className={styles.summaryMeta}>
                <span>{vn.released || "TBA"}</span>
                {vn.lengthMinutes ? <span>{Math.round(vn.lengthMinutes / 60)}h avg</span> : null}
                {vn.platforms?.length ? <span>{vn.platforms.slice(0, 2).join(", ")}</span> : null}
                {vn.languages?.length ? <span>{vn.languages.slice(0, 2).join(", ")}</span> : null}
              </div>
              <p className={styles.snippet} dangerouslySetInnerHTML={{ __html: formatDescription(vn.description) }} />
            </Link>
          </article>
          );
        })}
        {status === "loading" && (
          <div className={styles.loading}>
            <span />
            <span />
            <span />
          </div>
        )}
      </div>
    </div>
  );
}

