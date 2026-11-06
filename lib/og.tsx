import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const OG_SIZE = { width: 1200, height: 630 };

/** The image renderer lays text out left to right only, so Hebrew is passed in visual order. */
const visual = (he: string) => [...he].reverse().join("");

const asset = (...p: string[]) => readFile(join(process.cwd(), ...p));

/** Link-preview card (WhatsApp, iMessage, Facebook, X): masechta and daf, shiur title, the Rav's photo. */
export async function ogCard({ kicker, he, title, footer }: { kicker: string; he?: string; title: string; footer?: string }) {
  const [fig5, fig7, frank, photo] = await Promise.all([
    asset("assets/og/figtree-500.ttf"),
    asset("assets/og/figtree-700.ttf"),
    asset("assets/og/frank-700.ttf"),
    asset("public/rabbi.jpg"),
  ]);
  const img = `data:image/jpeg;base64,${photo.toString("base64")}`;
  const size = title.length > 60 ? 54 : title.length > 36 ? 62 : 72;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "linear-gradient(135deg, #2d55ef 0%, #0a2398 100%)", color: "#fff", fontFamily: "Figtree" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "56px 40px 52px 64px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
            {he && <div style={{ fontFamily: "Frank", fontSize: 30, color: "#c9d5ff", lineHeight: 1 }}>{visual(`מסכת ${he}`)}</div>}
            <div style={{ fontFamily: "Frank", fontSize: 50, lineHeight: 1 }}>{visual("עין יעקב")}</div>
          </div>
          <div style={{ marginTop: 36, fontSize: 30, fontWeight: 700, letterSpacing: 2, color: "#c9d5ff", textTransform: "uppercase" }}>{kicker}</div>
          <div style={{ marginTop: 14, fontSize: size, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1 }}>{title}</div>
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 34, fontWeight: 700 }}>{SITE.rav}</div>
            <div style={{ fontSize: 26, fontWeight: 500, color: "#c9d5ff" }}>{footer ?? "einyaakovshiur.com"}</div>
          </div>
        </div>
        <div style={{ width: 400, display: "flex", alignItems: "center", justifyContent: "center", paddingRight: 56 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} width={344} height={398} alt="" style={{ borderRadius: 28, objectFit: "cover", border: "6px solid rgba(255,255,255,.9)" }} />
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Figtree", data: fig5, weight: 500, style: "normal" },
        { name: "Figtree", data: fig7, weight: 700, style: "normal" },
        { name: "Frank", data: frank, weight: 700, style: "normal" },
      ],
    },
  );
}
