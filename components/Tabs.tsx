"use client";

import { useState } from "react";

/** Tabs whose panels are all server-rendered; inactive ones are hidden, so their text stays in the HTML. */
export function Tabs({ labels, children }: { labels: string[]; children: React.ReactNode[] }) {
  const [active, setActive] = useState(0);
  return (
    <div className="panel">
      <div className="tabs" role="tablist">
        {labels.map((l, i) => (
          <button key={l} className="tab" role="tab" aria-selected={active === i} onClick={() => setActive(i)}>{l}</button>
        ))}
      </div>
      {children.map((c, i) => <div key={labels[i]} role="tabpanel" hidden={active !== i}>{c}</div>)}
    </div>
  );
}
