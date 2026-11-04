import fs from "node:fs";
import path from "node:path";
import { SITE } from "@/lib/site";

/** Shows public/rabbi.jpg when it exists; renders nothing until the photo is added. */
const FILE = "rabbi.jpg";
const exists = fs.existsSync(path.join(process.cwd(), "public", FILE));

export function RavPhoto({ size = "sm" }: { size?: "sm" | "lg" }) {
  if (!exists) return null;
  return <img className={`rav-photo ${size}`} src={`/${FILE}`} alt={SITE.rav} width={size === "lg" ? 455 : 56} height={size === "lg" ? 526 : 56} />;
}
