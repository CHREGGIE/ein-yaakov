import { masechta, masechtos, published } from "@/lib/catalog";
import { OG_SIZE, ogCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Ein Yaakov shiurim with Rabbi Chaim Fogelman";
export const dynamicParams = false;
export function generateStaticParams() { return masechtos().map((m) => ({ masechta: m.slug })); }

export default async function Image({ params }: { params: Promise<{ masechta: string }> }) {
  const m = masechta((await params).masechta)!;
  const n = published().filter((s) => s.masechta === m.slug).length;
  return ogCard({ kicker: `${n} shiur${n === 1 ? "" : "im"}`, he: m.he, title: `Ein Yaakov on Masechta ${m.name}`, footer: `einyaakovshiur.com/${m.slug}` });
}
