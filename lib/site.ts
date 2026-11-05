export const SITE = {
  name: "Ein Yaakov with Rabbi Chaim Fogelman",
  short: "Ein Yaakov",
  rav: "Rabbi Chaim Fogelman",
  shul: "the Itchkes Shtiebel",
  when: "Tuesday nights at 8pm",
  description:
    "A weekly shiur on the aggados of the Gemara as collected in the Ein Yaakov, masechta by masechta, with Rabbi Chaim Fogelman.",
  /** The show description podcast apps display. Plain text; keep under 4,000 characters. */
  podcastDescription:
    "A weekly shiur on the Ein Yaakov, the classic collection of the aggados of the Talmud: the stories, parables and teachings woven through every masechta of the Gemara. " +
    "Each week Rabbi Chaim Fogelman reads the Gemara inside with Rashi, the Maharsha and the commentaries printed alongside it, and draws out what Chazal are teaching about Hashem, the soul and how a person should live. " +
    "The podcast follows the shiur masechta by masechta, starting with Kesuvos. Every past shiur, with a summary and chapters, is at einyaakovshiur.com.",
  // SITE_URL wins; otherwise use the production domain Vercel exposes to every build.
  url: (process.env.SITE_URL
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
  ).replace(/\/$/, ""),
  audioBase: (process.env.AUDIO_BASE_URL || "").replace(/\/$/, ""),
  op3: process.env.OP3 === "1",
  ownerName: process.env.PODCAST_OWNER_NAME || "",
  ownerEmail: process.env.PODCAST_OWNER_EMAIL || "",
  /** Show pages in the podcast apps. Each badge appears once its link is set. */
  listen: {
    spotify: process.env.SPOTIFY_URL || "https://open.spotify.com/show/06NyPmLt9e35F8Yc402QlW",
    apple: process.env.APPLE_PODCASTS_URL || "https://podcasts.apple.com/us/podcast/ein-yaakov-with-rabbi-fogelman/id6830361751",
    amazon: "https://music.amazon.com/podcasts/8377bbda-5e83-4a04-b099-99c8e978fd0c/ein-yaakov-with-rabbi-fogelman",
    iheart: "https://www.iheart.com/podcast/269-ein-yaakov-with-rabbi-foge-349137341/",
  },
};

export const SEDARIM: Record<string, [string, string]> = {
  zeraim: ["Zeraim", "זרעים"], moed: ["Moed", "מועד"], nashim: ["Nashim", "נשים"],
  nezikin: ["Nezikin", "נזיקין"], kodashim: ["Kodashim", "קדשים"], taharos: ["Taharos", "טהרות"],
};
