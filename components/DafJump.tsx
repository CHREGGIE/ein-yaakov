"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { findDaf } from "@/lib/search";
import { dafRange } from "@/lib/daf";
import type { ShiurLite } from "@/lib/types";

export function DafJump({ masechta, shiurim }: { masechta: string; shiurim: ShiurLite[] }) {
  const router = useRouter();
  const [v, setV] = useState("");
  const [msg, setMsg] = useState("");
  return (
    <form className="dafbox" onSubmit={(e) => {
      e.preventDefault();
      const r = findDaf(shiurim, v);
      if ("hit" in r) router.push(r.hit.href);
      else setMsg("error" in r ? r.error : `No shiur covers daf ${r.daf}. Closest: Shiur ${r.near.number} on ${dafRange(r.near)}.`);
    }}>
      <input id={`daf-${masechta}`} value={v} onChange={(e) => { setV(e.target.value); setMsg(""); }} placeholder={`Go to daf, e.g. ${shiurim[0]?.daf_start}`} aria-label="Go to daf" autoComplete="off" />
      <button className="btn">Go</button>
      {msg && <p className="hint" style={{ padding: 0, flexBasis: "100%" }} role="status">{msg}</p>}
    </form>
  );
}
