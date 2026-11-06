import { OG_SIZE, ogCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Ein Yaakov with Rabbi Chaim Fogelman";

export default function Image() {
  return ogCard({ kicker: "Shiur and podcast", title: "Ein Yaakov, daf by daf, with the stories and lessons of Chazal" });
}
