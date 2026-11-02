"use client";
import { useCallback, useEffect, useState } from "react";
import { PlayerGrid36 } from "@/components/PlayerGrid36";
import { announce, getSnapshot, watchRoom } from "@/lib/room-client";
import type { Phase, RoomSnapshot } from "@/lib/types";

const commands: { phase: Phase; label: string; minutes?: number }[] = [
  { phase: "night", label: "เริ่มกลางคืน" }, { phase: "discussion", label: "เปิดอภิปราย 5 นาที", minutes: 5 }, { phase: "voting", label: "เปิดหีบโหวต", minutes: 2 }, { phase: "summary", label: "สรุปผลเช้า" }, { phase: "game_over", label: "จบเกม" }
];
export default function HostPage({ params }: { params: { code: string } }) {
  const code = params.code.toUpperCase(); const [data, setData] = useState<RoomSnapshot>(); const [key, setKey] = useState(""); const [error, setError] = useState("");
  const refresh = useCallback(() => getSnapshot(code).then(setData).catch(e => setError(e.message)), [code]);
  useEffect(() => { refresh(); return watchRoom(code, refresh); }, [code, refresh]);
  async function command(phase: Phase, minutes?: number) { const r = await fetch("/api/host/command", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code, hostKey: key, phase, minutes }) }); if (!r.ok) return setError((await r.json()).error ?? "Command failed"); await announce(code); await refresh(); }
  const alive = data?.players.filter(p => p.is_alive).length ?? 0;
  return <main className="mx-auto max-w-7xl p-4 lg:p-8"><header className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-cyan/30 pb-4"><div><p className="text-xs tracking-[.3em] text-cyan">COMMAND CENTER · {code}</p><h1 className="text-3xl font-black">OUTBREAK PROTOCOL</h1></div><div className="text-right"><p className="text-2xl font-bold text-cyan">{data?.room.phase?.toUpperCase() ?? "CONNECTING"}</p><p className="text-xs text-slate-400">DAY {data?.room.day_number ?? 0} · {alive}/36 VITAL</p></div></header>
  <div className="mb-5 flex flex-wrap gap-2"><input type="password" className="w-52 rounded border border-slate-600 bg-panel p-3 text-sm" placeholder="Host control key" value={key} onChange={e => setKey(e.target.value)} />{commands.map(c => <button key={c.phase} onClick={() => command(c.phase, c.minutes)} className="rounded border border-cyan/50 bg-panel px-4 py-3 text-sm font-bold hover:bg-cyan hover:text-ink">{c.label}</button>)}</div>
  {error && <p className="mb-4 rounded border border-emergency bg-emergency/10 p-3 text-emergency">{error}</p>}
  <div className="grid gap-5 lg:grid-cols-[1fr_280px]"><PlayerGrid36 players={data?.players ?? []} revealRoles/><aside className="rounded border border-slate-700 bg-panel p-4"><h2 className="font-bold text-cyan">MORNING BRIEFING</h2><ul className="mt-3 space-y-3 text-sm text-slate-300">{data?.room.morning_log?.map((x,i) => <li key={i}>› {x}</li>) || <li>Awaiting secure telemetry…</li>}</ul><p className="mt-6 text-xs text-slate-500">⚡ selected skill · ✓ vote locked</p></aside></div></main>;
}
