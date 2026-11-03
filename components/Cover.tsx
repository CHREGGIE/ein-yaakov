import { SITE } from "@/lib/site";

/** Cover art: the block echoes a page of Gemara, text in the center and commentary around it. */
export function Cover({ he, en, small }: { he?: string; en?: string; small?: boolean }) {
  if (small) return <div className="cover sm" aria-hidden="true"><div className="cv-he">{he ?? "ע״י"}</div></div>;
  return (
    <div className="cover" role="img" aria-label={`Ein Yaakov${en ? " on " + en : ""} with ${SITE.rav}`}>
      <div className="cv-page"><i /><i /><i /></div>
      <div className="cv-he">{he ?? "עין יעקב"}</div>
      <div className="cv-en">{(en ?? "Ein Yaakov").toUpperCase()}</div>
      <div className="cv-by">RABBI FOGELMAN</div>
    </div>
  );
}
