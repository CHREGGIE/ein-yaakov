import Link from "next/link";
import { SITE } from "@/lib/site";

export function SideBlocks() {
  return (
    <>
      <div className="block">
        <div className="block-head">This learning is dedicated</div>
        <p><Link href="/dedication">L&apos;iluy nishmas Rabbi Shmuel Eliyahu ben Chaim Elchonon Fogelman</Link>, the Rav&apos;s father, a dedicated educator for more than 60 years.</p>
      </div>
      <div className="block">
        <div className="block-head">Dedicate a shiur</div>
        <p>Sponsor a week&apos;s shiur l&apos;iluy nishmas a loved one or in honor of a simcha. The dedication is announced at the start of the shiur and shown on its page.</p>
        <p>Dedications are coming soon.</p>
      </div>
      <div className="block">
        <div className="block-head">Join the shiur live</div>
        <p>{SITE.rav} gives the shiur {SITE.when} at {SITE.shul}. Everyone is welcome.</p>
      </div>
    </>
  );
}
