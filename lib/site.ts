export const SITE = {
  name: "Ein Yaakov with Rabbi Fogelman",
  short: "Ein Yaakov",
  rav: "Rabbi Fogelman",
  description:
    "A weekly shiur on the aggados of the Gemara as collected in the Ein Yaakov, masechta by masechta, with Rabbi Fogelman.",
  url: (process.env.SITE_URL || "https://ein-yaakov.vercel.app").replace(/\/$/, ""),
  audioBase: (process.env.AUDIO_BASE_URL || "").replace(/\/$/, ""),
  op3: process.env.OP3 === "1",
  ownerName: process.env.PODCAST_OWNER_NAME || "",
  ownerEmail: process.env.PODCAST_OWNER_EMAIL || "",
};

export const SEDARIM: Record<string, [string, string]> = {
  zeraim: ["Zeraim", "זרעים"], moed: ["Moed", "מועד"], nashim: ["Nashim", "נשים"],
  nezikin: ["Nezikin", "נזיקין"], kodashim: ["Kodashim", "קדשים"], taharos: ["Taharos", "טהרות"],
};
