import { NextResponse } from "next/server";
import { masechtos, published } from "@/lib/catalog";
import { findDaf, resolveMasechta } from "@/lib/search";

/** /daf/<masechta>/<daf> redirects to the shiur covering that daf (or the nearest one). */
export async function GET(req: Request, { params }: { params: Promise<{ masechta: string; daf: string }> }) {
  const p = await params;
  const m = resolveMasechta(decodeURIComponent(p.masechta), masechtos());
  if (!m) return NextResponse.redirect(new URL("/", req.url));
  const r = findDaf(published().filter((s) => s.masechta === m.slug), p.daf);
  const s = "hit" in r ? r.hit : "near" in r ? r.near : null;
  return NextResponse.redirect(new URL(s ? `/${m.slug}/${s.number}` : `/${m.slug}`, req.url));
}
