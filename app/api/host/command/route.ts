import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
const body=z.object({code:z.string().min(4).max(12),hostKey:z.string().min(12).max(200),phase:z.enum(["lobby","night","discussion","voting","summary","game_over"]),minutes:z.number().int().min(1).max(60).optional()});
export async function POST(req:Request){const p=body.safeParse(await req.json());if(!p.success)return NextResponse.json({error:"Invalid command"},{status:400});const {error}=await supabaseAdmin.rpc("host_transition",{p_code:p.data.code.toUpperCase(),p_host_key:p.data.hostKey,p_phase:p.data.phase,p_minutes:p.data.minutes??null});return error?NextResponse.json({error:error.message},{status:403}):NextResponse.json({ok:true});}
