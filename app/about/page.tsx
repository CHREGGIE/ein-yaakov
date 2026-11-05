import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { Cover } from "@/components/Cover";
import { Listen } from "@/components/Listen";
import { RavPhoto } from "@/components/RavPhoto";
import { SideBlocks } from "@/components/Side";

export const metadata: Metadata = {
  title: `About the shiur and ${SITE.rav}`,
  description: `${SITE.rav} gives a weekly Ein Yaakov shiur ${SITE.when} at ${SITE.shul}. Every shiur is online by masechta and daf, and new shiurim go out weekly as a podcast.`,
  alternates: { canonical: "/about" },
};

export default function About() {
  return (
    <div className="layout">
      <div className="side-top"><RavPhoto size="lg" /><Cover /></div>
      <div className="side-more"><SideBlocks /></div>
      <section className="main-col prose">
        <span className="eyebrow">About the shiur</span>
        <h1 className="title">{SITE.name}</h1>
        <p>{SITE.rav} gives a weekly shiur at {SITE.shul} on the Ein Yaakov, Rabbi Yaakov ibn Chaviv&apos;s collection of the aggados of the Talmud. The shiur moves through each masechta in order, reading the Gemara inside with Rashi and the commentaries printed alongside it.</p>
        <h2>When and where</h2>
        <p>The shiur is given {SITE.when} at {SITE.shul}. Everyone is welcome.</p>
        <h2>Listen</h2>
        <p>Every shiur is here, dated by when it was given. New shiurim also go out weekly as a podcast.</p>
        <Listen />
      </section>
    </div>
  );
}
