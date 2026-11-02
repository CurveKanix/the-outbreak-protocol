"use client";
import clsx from "clsx";
import type { Player } from "@/lib/types";

export function PlayerGrid36({ players, revealRoles = false }: { players: Player[]; revealRoles?: boolean }) {
  return <section className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6" aria-label="Player status grid">
    {Array.from({ length: 36 }, (_, i) => {
      const p = players.find(x => x.seat === i + 1);
      return <article key={i} className={clsx("min-h-24 rounded border p-2", !p ? "border-slate-800 bg-slate-950/30 text-slate-600" : p.is_alive ? "border-cyan/40 bg-panel" : "border-emergency/40 bg-emergency/10 opacity-60")}>
        <div className="text-[10px] font-bold tracking-widest">BED {String(i + 1).padStart(2, "0")}</div>
        <div className="mt-2 truncate text-sm font-bold">{p?.display_name ?? "VACANT"}</div>
        {p && <div className="mt-2 flex gap-1 text-[10px]"><span className={p.is_alive ? "text-cyan" : "text-emergency"}>{p.is_alive ? "● ALIVE" : "✕ LOST"}</span>{p.has_acted && <span>⚡</span>}{p.has_voted && <span>✓</span>}</div>}
        {p && revealRoles && <div className="mt-1 text-[10px] uppercase text-amber-300">{p.role ?? "sealed"}</div>}
      </article>;
    })}
  </section>;
}
