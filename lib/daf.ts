/** Daf helpers: "17a" style references, Hebrew numerals, ranges. */

export function dafIdx(d: string): number | null {
  const m = /^(\d+)([ab])?$/.exec(d);
  return m ? +m[1] * 2 + (m[2] === "b" ? 1 : 0) : null;
}

export function heNum(n: number): string {
  const ones = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
  const tens = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
  const hund = ["", "ק", "ר", "ש", "ת"];
  let s = hund[Math.floor(n / 100)] || "";
  const r = n % 100;
  s += r === 15 ? "טו" : r === 16 ? "טז" : tens[Math.floor(r / 10)] + ones[r % 10];
  return s.length === 1 ? s + "׳" : s.slice(0, -1) + "״" + s.slice(-1);
}

export function heDaf(d: string): string {
  const m = /^(\d+)([ab])$/.exec(d);
  return m ? heNum(+m[1]) + (m[2] === "a" ? " ע״א" : " ע״ב") : "";
}

type HasDaf = { daf_start: string; daf_end: string };
export const dafRange = (s: HasDaf) => (s.daf_start === s.daf_end ? s.daf_start : `${s.daf_start}–${s.daf_end}`);
export const heRange = (s: HasDaf) => (s.daf_start === s.daf_end ? heDaf(s.daf_start) : `${heDaf(s.daf_start)} – ${heDaf(s.daf_end)}`);

export function fmtTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${x}` : `${m}:${x}`;
}

export function fmtDate(iso: string | null): string {
  if (!iso) return "Date to be confirmed";
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export const mins = (sec: number) => `${Math.round(sec / 60)} mins`;
