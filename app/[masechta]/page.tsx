import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { inOrder, lite, masechta, masechtos } from "@/lib/catalog";
import { SEDARIM } from "@/lib/site";
import { Cover } from "@/components/Cover";
import { DafJump } from "@/components/DafJump";
import { Library } from "@/components/Library";
import { StartButtons } from "@/components/Player";
import { SideBlocks } from "@/components/Side";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbsLd } from "@/lib/seo";

export const dynamicParams = false;
export function generateStaticParams() { return masechtos().map((m) => ({ masechta: m.slug })); }

type P = { params: Promise<{ masechta: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const m = masechta((await params).masechta);
  return m ? {
    title: `Ein Yaakov on ${m.name} (${m.he})`,
    description: `Every shiur on the aggados of Masechta ${m.name} (${m.he}) in the Ein Yaakov with Rabbi Fogelman, by daf, with a summary and chapters for each.`,
    alternates: { canonical: `/${m.slug}` },
  } : {};
}

export default async function MasechtaPage({ params }: P) {
  const m = masechta((await params).masechta);
  if (!m) notFound();
  const all = inOrder().map(lite);
  const mine = all.filter((s) => s.masechta === m.slug);
  const hours = Math.round(mine.reduce((a, s) => a + s.audio.duration_sec, 0) / 3600 * 10) / 10;
  return (
    <div className="layout masechta-page">
      <JsonLd data={breadcrumbsLd([{ name: "Shiurim", path: "/" }, { name: m.name, path: `/${m.slug}` }])} />
      <div className="side-top">
        <Cover he={m.he} en={m.name} />
        <div className="by"><h1 className="show-name">Ein Yaakov on {m.name}</h1>Seder {SEDARIM[m.seder][0]}</div>
        <StartButtons first={mine[0]} all={mine} />
        <DafJump masechta={m.slug} shiurim={mine} />
      </div>
      <div className="side-more">
        <div className="block"><dl className="num">
          <dt>Shiurim</dt><dd>{mine.length}</dd>
          <dt>Dapim</dt><dd>{mine[0].daf_start}–{mine[mine.length - 1].daf_end}</dd>
          <dt>Hours</dt><dd>{hours}</dd>
        </dl></div>
        <SideBlocks />
      </div>
      <section className="main-col">
        <p className="lede"><b>Ein Yaakov on {m.name}</b> <span className="he" lang="he" style={{ color: "var(--accent)", fontWeight: 700 }}>{m.he}</span>. {m.description ?? `${mine.length} shiurim on the aggados of the masechta, in order.`}</p>
        <Library masechtos={masechtos()} shiurim={all} active={m.slug} />
      </section>
    </div>
  );
}
