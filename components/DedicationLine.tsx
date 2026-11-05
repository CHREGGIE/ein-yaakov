import Link from "next/link";

/** The shiur's standing dedication, linking to the page about the Rav's father. */
export function DedicationLine({ className = "" }: { className?: string }) {
  return (
    <p className={`ded-line ${className}`}>
      This learning is dedicated <Link href="/dedication">l&apos;iluy nishmas Rabbi Shmuel Eliyahu ben Chaim Elchonon Fogelman</Link>
      <span className="he ded-he" lang="he">לע״נ הרב שמואל אליהו בן חיים אלחנן</span>
    </p>
  );
}
