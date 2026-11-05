import { SITE } from "@/lib/site";

/**
 * Cover art: the block echoes a page of Gemara, text in the center and commentary around it.
 * עין יעקב is always the main title; a masechta appears only as a smaller subtitle,
 * so a masechta cover never reads as a Gemara shiur.
 */
export function Cover({ he, en, small }: { he?: string; en?: string; small?: boolean }) {
  if (small) return <div className="cover sm" aria-hidden="true"><div className="cv-he">ע</div></div>;
  return (
    <div className={`cover${he ? " has-m" : ""}`} role="img" aria-label={`Ein Yaakov${en ? " on " + en : ""} with ${SITE.rav}`}>
      <div className="cv-page"><i /><i /><i /></div>
      {he && <div className="cv-m" lang="he">מסכת {he}</div>}
      <div className="cv-he">עין יעקב</div>
      <div className="cv-en">EIN YAAKOV</div>
      <div className="cv-by">{en ? `${en.toUpperCase()} · ` : ""}{SITE.rav.toUpperCase()}</div>
    </div>
  );
}
