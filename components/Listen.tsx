import { SITE } from "@/lib/site";

const APPS = [
  { key: "apple", label: "Apple Podcasts" },
  { key: "amazon", label: "Amazon Music" },
  { key: "iheart", label: "iHeartRadio" },
] as const;

/**
 * "Listen on" links for the podcast apps, plus the RSS feed. Apps without a link set are left out.
 * `compact` shows the Spotify badge with the other apps folded behind "More apps" on phones.
 */
export function Listen({ onAccent = false, compact = false }: { onAccent?: boolean; compact?: boolean }) {
  const cls = onAccent ? "chip-l" : "btn ghost";
  const others = (
    <>
      {APPS.filter((a) => SITE.listen[a.key]).map((a) => (
        <a key={a.key} className={cls} href={SITE.listen[a.key]} target="_blank" rel="noopener">{a.label}</a>
      ))}
      <a className={cls} href="/feed.xml">RSS feed</a>
    </>
  );
  return (
    <div className={`listen${compact ? " compact" : ""}`}>
      {SITE.listen.spotify && (
        <a href={SITE.listen.spotify} target="_blank" rel="noopener" aria-label="Listen on Spotify">
          <img className="badge" src="/badges/spotify.svg" alt="Listen on Spotify" width={165} height={40} />
        </a>
      )}
      {compact ? (
        <>
          <span className="lg-contents">{others}</span>
          <details className="more-apps sm-only">
            <summary className={cls}>More apps</summary>
            <div className="more-list">{others}</div>
          </details>
        </>
      ) : others}
    </div>
  );
}
