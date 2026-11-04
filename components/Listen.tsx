import { SITE } from "@/lib/site";

/** "Listen on" badges for the podcast apps, plus the RSS feed. Apps without a link set are left out. */
export function Listen({ onAccent = false }: { onAccent?: boolean }) {
  const { spotify, apple } = SITE.listen;
  return (
    <div className="listen">
      {spotify && (
        <a href={spotify} target="_blank" rel="noopener" aria-label="Listen on Spotify">
          <img className="badge" src="/badges/spotify.svg" alt="Listen on Spotify" width={165} height={40} />
        </a>
      )}
      {apple && <a className={onAccent ? "chip-l" : "btn ghost"} href={apple} target="_blank" rel="noopener">Apple Podcasts</a>}
      <a className={onAccent ? "chip-l" : "btn ghost"} href="/feed.xml">RSS feed</a>
    </div>
  );
}
