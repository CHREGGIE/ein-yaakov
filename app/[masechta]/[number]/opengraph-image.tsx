import { masechta, published, shiur } from "@/lib/catalog";
import { dafRange } from "@/lib/daf";
import { OG_SIZE, ogCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Ein Yaakov shiur with Rabbi Chaim Fogelman";
export const dynamicParams = false;
export function generateStaticParams() {
  return published().map((s) => ({ masechta: s.masechta, number: String(s.number) }));
}

export default async function Image({ params }: { params: Promise<{ masechta: string; number: string }> }) {
  const p = await params;
  const m = masechta(p.masechta)!, s = shiur(p.masechta, Number(p.number))!;
  return ogCard({ kicker: `${m.name} ${dafRange(s)}`, he: m.he, title: s.title, footer: `einyaakovshiur.com/${m.slug}/${s.number}` });
}
