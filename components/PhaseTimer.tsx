"use client";
import { useEffect, useState } from "react";
export function PhaseTimer({ endsAt }: { endsAt?: string | null }) {
  const [left,setLeft]=useState(0);
  useEffect(()=>{if(!endsAt){setLeft(0);return;}const tick=()=>setLeft(Math.max(0,Math.ceil((new Date(endsAt).getTime()-Date.now())/1000)));tick();const id=window.setInterval(tick,1000);return()=>clearInterval(id);},[endsAt]);
  useEffect(()=>{if(left===10)navigator.vibrate?.([80,60,80]);},[left]);
  if(!endsAt)return null;
  return <span className={left<=10?"text-emergency":"text-cyan"}>T−{String(Math.floor(left/60)).padStart(2,"0")}:{String(left%60).padStart(2,"0")}</span>;
}
