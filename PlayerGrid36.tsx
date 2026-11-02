"use client";
import clsx from "clsx";
import type { Player } from "@/lib/types";

export function PlayerGrid36({ players, revealRoles = false }: { players: Player[]; revealRoles?: boolean }) {
  return <section className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6" aria-label="Player status grid">
    {Array.from({ length: 36 }, (_, i) => {
      const p = players.find(x => x.seat === i + 1);
      return <article key={i} className={clsx("relative min-h-24 overflow-hidden rounded-xl border p-3", !p ? "border-slate-800/70 bg-slate-950/20 text-slate-700" : p.is_alive ? "border-cyan/35 bg-panel/90 shadow-[inset_0_1px_0_rgba(54,230,255,.08)]" : "border-emergency/40 bg-emergency/10 opacity-70")}>
        <div className="flex justify-between text-[10px] font-bold tracking-widest"><span>BED {String(i + 1).padStart(2, "0")}</span><span>{p?.is_alive ? "✚" : "—"}</span></div>
        <div className="mt-2 truncate text-sm font-bold">{p?.display_name ?? "VACANT"}</div>
        {p && <div className="mt-2 flex gap-1 text-[10px]"><span className={p.is_alive ? "text-cyan" : "text-emergency"}>{p.is_alive ? "● VITAL" : "✕ LOST"}</span>{p.has_acted && <span title="Skill locked">⚡</span>}{p.has_voted && <span title="Vote locked">✓</span>}</div>}
        {p && revealRoles && <div className="mt-1 text-[10px] uppercase text-amber-300">{p.role ?? "sealed"}</div>}
      </article>;
    })}
  </section>;
}
