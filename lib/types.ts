export type Masechta = {
  slug: string;
  name: string;
  he: string;
  seder: "zeraim" | "moed" | "nashim" | "nezikin" | "kodashim" | "taharos";
  aliases: string[];
  /** Library order (by when the masechta was learned). */
  order: number;
  /** Podcast season; null for masechtos that are in the library only. */
  season: number | null;
  description?: string;
};

export type Chapter = { start: number; title: string };
export type Paragraph = { start: number; text: string };

export type ShiurFile = {
  guid: string;
  masechta: string;
  number: number;
  status: "drafted" | "reviewed" | "published";
  in_feed: boolean;
  given_on: string | null;
  title: string;
  label?: string;
  daf_start: string;
  daf_end: string;
  summary: string;
  dedication?: string;
  /** 3-5 short takeaways shown as "Key ideas". */
  key_ideas?: string[];
  /** Commentaries and stories the Rav cites, with where they come up in the recording. */
  sources?: { title: string; start: number }[];
  chapters: Chapter[];
  /** rev: bump to give podcast apps a new audio URL (same file) when they need to re-fetch it. */
  audio: { file: string; bytes: number; duration_sec: number; rev?: number };
  transcript: Paragraph[];
};

/** What client components get: everything but the transcript. */
export type ShiurLite = Omit<ShiurFile, "transcript"> & {
  id: string;
  href: string;
  masechtaName: string;
  masechtaHe: string;
  audioUrl: string | null;
};
