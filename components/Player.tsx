"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ShiurLite } from "@/lib/types";
import { dafRange, fmtDate, fmtTime } from "@/lib/daf";
import { PauseIcon, PlayIcon } from "./Icons";
import { Cover } from "./Cover";

type Ctx = {
  current: ShiurLite | null;
  playing: boolean;
  pos: number;
  play: (s: ShiurLite, at?: number) => void;
  /** Load a shiur at a time without starting playback (browsers block autoplay). */
  cue: (s: ShiurLite, at: number) => void;
  toggle: (s: ShiurLite) => void;
};
const PlayerCtx = createContext<Ctx | null>(null);
export const usePlayer = () => useContext(PlayerCtx)!;

const RATES = [1, 1.25, 1.5, 1.75, 2];
const KEY = "ey-progress";

/** Remembers each listener's place per masechta, so "Continue" works without accounts. */
export function readProgress(): Record<string, { number: number; pos: number }> {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
function saveProgress(s: ShiurLite, pos: number) {
  if (pos < 5) return;
  try {
    const p = readProgress();
    p[s.masechta] = { number: s.number, pos: Math.floor(pos) };
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
}

export function PlayerProvider({ initial, children }: { initial: ShiurLite | null; children: React.ReactNode }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [current, setCurrent] = useState<ShiurLite | null>(initial);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(initial?.audio.duration_sec ?? 0);
  const [rate, setRate] = useState(1);
  const pending = useRef<number | null>(null);

  const play = useCallback((s: ShiurLite, at?: number) => {
    const el = audio.current;
    if (!el) return;
    if (current?.id !== s.id) {
      setCurrent(s); setPos(at ?? 0); setDur(s.audio.duration_sec);
      pending.current = at ?? 0;
      if (s.audioUrl) { el.src = s.audioUrl; el.load(); }
    } else if (at != null) { el.currentTime = at; }
    if (s.audioUrl) el.play().catch(() => setPlaying(false));
  }, [current]);

  const cue = useCallback((s: ShiurLite, at: number) => {
    const el = audio.current;
    if (!el) return;
    setCurrent(s); setPos(at); setDur(s.audio.duration_sec);
    pending.current = at;
    if (s.audioUrl) { el.src = s.audioUrl; el.preload = "metadata"; el.load(); }
  }, []);

  const toggle = useCallback((s: ShiurLite) => {
    if (current?.id === s.id && playing) audio.current?.pause(); else play(s);
  }, [current, playing, play]);

  useEffect(() => { if (audio.current) audio.current.playbackRate = rate; }, [rate, current]);

  const onLoaded = () => {
    const el = audio.current!;
    if (pending.current != null) { el.currentTime = pending.current; pending.current = null; }
    el.playbackRate = rate;
    if (isFinite(el.duration)) setDur(el.duration);
  };
  const onTime = () => {
    const t = audio.current!.currentTime;
    setPos(t);
    if (current) saveProgress(current, t);
  };
  const skip = (d: number) => { const el = audio.current; if (el) el.currentTime = Math.max(0, Math.min(dur, el.currentTime + d)); };

  return (
    <PlayerCtx.Provider value={{ current, playing, pos, play, cue, toggle }}>
      {children}
      <audio ref={audio} preload="none" src={initial?.audioUrl ?? undefined}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
        onLoadedMetadata={onLoaded} onTimeUpdate={onTime} />
      {current && (
        <div className="pbar">
          <div className="pb-in">
            <div className="pb-art"><Cover he={current.masechtaHe} small /></div>
            <Link className="pb-info" href={current.href}>
              <b>{current.title}</b>
              <span>{current.masechtaName} {dafRange(current)} · {fmtDate(current.given_on)}</span>
            </Link>
            <div className="pb-ctrls">
              <button className="pill" onClick={() => setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length])} aria-label="Playback speed">{rate}×</button>
              <button className="pill pb-skip" onClick={() => skip(-15)} aria-label="Back 15 seconds">−15</button>
              <button className="pb-play" onClick={() => toggle(current)} aria-label={playing ? "Pause" : "Play"} disabled={!current.audioUrl}>
                {playing ? <PauseIcon /> : <PlayIcon />}
              </button>
              <button className="pill pb-skip" onClick={() => skip(30)} aria-label="Forward 30 seconds">+30</button>
            </div>
            {current.audioUrl ? (
              <div className="pb-scrub">
                <span>{fmtTime(pos)}</span>
                <input type="range" min={0} max={Math.max(1, Math.floor(dur))} value={Math.floor(pos)} aria-label="Position"
                  onChange={(e) => { if (audio.current) audio.current.currentTime = +e.target.value; setPos(+e.target.value); }} />
                <span>−{fmtTime(dur - pos)}</span>
              </div>
            ) : <span className="pb-note">Audio is being uploaded and will be playable soon.</span>}
          </div>
        </div>
      )}
    </PlayerCtx.Provider>
  );
}

export function PlayButton({ s, variant = "ep" }: { s: ShiurLite; variant?: "ep" | "big" }) {
  const { current, playing, toggle } = usePlayer();
  const on = playing && current?.id === s.id;
  return (
    <button className={variant === "big" ? "big-play" : "ep-play"} aria-pressed={on}
      aria-label={`${on ? "Pause" : "Play"} ${s.title}`} onClick={() => toggle(s)}>
      {on ? <PauseIcon /> : <PlayIcon />}
    </button>
  );
}

export function PlayLabel({ s, chapters }: { s: ShiurLite; chapters: number }) {
  const { current, playing } = usePlayer();
  const on = playing && current?.id === s.id;
  return (
    <div className="lbl"><b>{on ? "Playing" : "Play shiur"}</b>
      <span className="num">{Math.round(s.audio.duration_sec / 60)} mins · {chapters} chapters</span></div>
  );
}

export function ChapterList({ s }: { s: ShiurLite }) {
  const { play, cue } = usePlayer();
  // A link like /kesuvos/2#t=575 (used for chapters in search results) cues the shiur at that point.
  useEffect(() => {
    const m = /^#t=(\d+)$/.exec(window.location.hash);
    if (m) cue(s, Number(m[1]));
  }, [s, cue]);
  return (
    <ol className="chapters">
      {s.chapters.map((c) => (
        <li key={c.start}><button onClick={() => play(s, c.start)}><span className="ts">{fmtTime(c.start)}</span><span>{c.title}</span></button></li>
      ))}
    </ol>
  );
}

export function StartButtons({ first, all }: { first: ShiurLite; all: ShiurLite[] }) {
  const { play } = usePlayer();
  const [prog, setProg] = useState<{ number: number; pos: number } | null>(null);
  useEffect(() => { setProg(readProgress()[first.masechta] ?? null); }, [first.masechta]);
  const cont = prog ? all.find((s) => s.number === prog.number) : undefined;
  return (
    <div className="actions">
      {cont && prog ? (
        <>
          <button className="btn" onClick={() => play(cont, prog.pos)}>Continue shiur {cont.number} at {fmtTime(prog.pos)}</button>
          <button className="btn ghost" onClick={() => play(first, 0)}>Start over</button>
        </>
      ) : <button className="btn" onClick={() => play(first, 0)}>Start from shiur 1</button>}
    </div>
  );
}

/** "Sources and stories": each item jumps the player to where it comes up. */
export function SourceList({ s }: { s: ShiurLite }) {
  const { play } = usePlayer();
  if (!s.sources?.length) return null;
  return (
    <ul className="sources">
      {s.sources.map((x) => (
        <li key={x.start}>
          <button onClick={() => play(s, x.start)}>
            <span>{x.title}</span><span className="ts">{fmtTime(x.start)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
