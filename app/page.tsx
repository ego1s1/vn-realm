import { Suspense } from "react";
import styles from "./page.module.css";
import SearchPanel from "@/components/search-panel";

function SearchPanelFallback() {
  return (
    <div style={{ padding: "20px", textAlign: "center", color: "rgba(255, 255, 255, 0.6)" }}>
      Loading...
    </div>
  );
}

export default function HomePage() {
  return (
    <main className={styles.main}>
      <Suspense fallback={<SearchPanelFallback />}>
        <SearchPanel />
      </Suspense>
      <footer className={styles.footer}>
        <p>
          Powered by <a href="https://vndb.org" target="_blank" rel="noreferrer">VNDB API</a> ❤️
        </p>
      </footer>
    </main>
  );
}

