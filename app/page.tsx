import styles from "./page.module.css";
import SearchPanel from "@/components/search-panel";

export default function HomePage() {
  return (
    <main className={styles.main}>
      <SearchPanel />
      <footer className={styles.footer}>
        <p>
          Powered by <a href="https://vndb.org" target="_blank" rel="noreferrer">VNDB API</a> ❤️
        </p>
      </footer>
    </main>
  );
}

