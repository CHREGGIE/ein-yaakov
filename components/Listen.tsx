import { SITE } from "@/lib/site";

const APPS = [
  { key: "apple", label: "Apple Podcasts" },
  { key: "amazon", label: "Amazon Music" },
  { key: "iheart", label: "iHeartRadio" },
] as const;

/** "Listen on" links for the podcast apps, plus the RSS feed. Apps without a link set are left out. */
export function Listen({ onAccent = false }: { onAccent?: boolean }) {
  const cls = onAccent ? "chip-l" : "btn ghost";
  return (
    <div className="listen">
      {SITE.listen.spotify && (
        <a href={SITE.listen.spotify} target="_blank" rel="noopener" aria-label="Listen on Spotify">
          <img className="badge" src="/badges/spotify.svg" alt="Listen on Spotify" width={165} height={40} />
        </a>
      )}
      {APPS.filter((a) => SITE.listen[a.key]).map((a) => (
        <a key={a.key} className={cls} href={SITE.listen[a.key]} target="_blank" rel="noopener">{a.label}</a>
      ))}
      <a className={cls} href="/feed.xml">RSS feed</a>
    </div>
  );
}
