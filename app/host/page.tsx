"use client";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { GameMode } from "@/lib/types";
const modes: { id: GameMode; title: string; copy: string }[] = [
  { id: "automatic", title: "AUTO PROTOCOL", copy: "ระบบเดิน phase ตามเวลาเมื่อ Host dashboard ยังเปิดอยู่" },
  { id: "manual", title: "MANUAL COMMAND", copy: "Host เลือกทุกจังหวะและทุก phase ด้วยตนเอง" },
  { id: "guided", title: "GUIDED COMMAND", copy: "ระบบแนะนำ phase ถัดไป และถามยืนยันก่อนดำเนินการ" }
];
export default function CreateHostRoom() {
  const [mode, setMode] = useState<GameMode>("guided"); const [result, setResult] = useState<{code:string;hostKey:string}>(); const [error,setError]=useState("");
  async function create() { setError(""); const r=await fetch("/api/host/create",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({mode})}); const j=await r.json(); if(!r.ok)return setError(j.error); sessionStorage.setItem(`outbreak:${j.code}:host-key`,j.hostKey);setResult(j); }
  const joinUrl = result && `${window.location.origin}/play/${result.code}`;
  if (result) return <main className="medical-shell mx-auto flex min-h-screen max-w-xl flex-col justify-center p-6"><p className="text-xs font-bold tracking-[.25em] text-cyan">✚ ROOM INITIALIZED</p><h1 className="mt-2 text-4xl font-black">Ward <span className="text-cyan">{result.code}</span> ready.</h1><section className="med-card mt-6 space-y-5 p-6"><div className="rounded-xl bg-white p-4"><QRCodeSVG value={joinUrl!} size={220} className="mx-auto" /></div><p className="text-center text-sm text-slate-400">ให้ผู้เล่นสแกน QR หรือเปิดลิงก์นี้</p><input className="med-input w-full text-center" readOnly value={joinUrl!}/><div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4"><p className="text-xs font-bold tracking-widest text-amber-300">HOST KEY — SAVE NOW</p><code className="mt-2 block break-all text-sm text-white">{result.hostKey}</code><p className="mt-2 text-xs text-amber-100/70">รหัสนี้จะแสดงครั้งเดียว ใช้ควบคุมเกม ห้ามแชร์กับผู้เล่น</p></div><a className="med-button block w-full text-center" href={`/host/${result.code}`}>OPEN COMMAND CENTER →</a></section></main>;
  return <main className="medical-shell mx-auto flex min-h-screen max-w-2xl flex-col justify-center p-6"><p className="text-xs font-bold tracking-[.25em] text-cyan">✚ HOST CONTROL PLANE</p><h1 className="mt-2 text-4xl font-black">Create an outbreak<br/><span className="text-cyan">simulation.</span></h1><p className="mt-3 text-slate-400">เฉพาะ Host เท่านั้นที่สามารถสร้าง ward ใหม่ได้</p><div className="mt-7 grid gap-3 md:grid-cols-3">{modes.map(m=><button key={m.id} onClick={()=>setMode(m.id)} className={`rounded-2xl border p-5 text-left ${mode===m.id?"border-cyan bg-cyan/10":"border-slate-700 bg-panel/50 hover:border-slate-500"}`}><p className="text-xs font-bold tracking-widest text-cyan">{m.title}</p><p className="mt-3 text-sm leading-6 text-slate-400">{m.copy}</p></button>)}</div><button onClick={create} className="med-button mt-5 w-full bg-cyan text-ink hover:bg-cyan">GENERATE SECURE ROOM</button>{error&&<p className="mt-3 text-sm text-emergency">{error}</p>}</main>;
}
