import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { validAdminKey } from "@/lib/host-admin";
const input = z.object({ mode: z.enum(["automatic", "manual", "guided"]), adminKey: z.string().min(1) });
const code = () => crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
export async function POST(req: Request) {
  const parsed = input.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid room request" }, { status: 400 });
  if (!validAdminKey(parsed.data.adminKey)) return NextResponse.json({ error: "Host Admin key is incorrect" }, { status: 403 });
  const hostKey = crypto.randomUUID();
  for (let i = 0; i < 5; i++) {
    const roomCode = code();
    const { data, error } = await supabaseAdmin.rpc("create_host_room", { p_code: roomCode, p_host_key: hostKey, p_mode: parsed.data.mode });
    if (!error) return NextResponse.json({ code: roomCode, room: data });
    if (!error.message.includes("duplicate")) return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ error: "Could not generate a unique room code" }, { status: 503 });
}
