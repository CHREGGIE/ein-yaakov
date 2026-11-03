import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { Cover } from "@/components/Cover";
import { SideBlocks } from "@/components/Side";

export const metadata: Metadata = { title: "About" };

export default function About() {
  return (
    <div className="layout">
      <div className="side-top"><Cover /></div>
      <div className="side-more"><SideBlocks /></div>
      <section className="main-col prose">
        <span className="eyebrow">About the shiur</span>
        <h1 className="title">{SITE.name}</h1>
        <p>{SITE.rav} gives a weekly shiur at the shul on the Ein Yaakov, Rabbi Yaakov ibn Chaviv&apos;s collection of the aggados of the Talmud. The shiur moves through each masechta in order, reading the Gemara inside with Rashi and the commentaries printed alongside it.</p>
        <p>Every shiur is here, dated by when it was given. New shiurim also go out weekly as a podcast.</p>
      </section>
    </div>
  );
}
