import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
const body=z.object({code:z.string().trim().min(4).max(12),hostKey:z.string().trim().min(1).max(200),phase:z.enum(["lobby","night","discussion","voting","summary","game_over"]),minutes:z.number().int().min(1).max(60).nullable().optional()});
export async function POST(req:Request){const p=body.safeParse(await req.json());if(!p.success)return NextResponse.json({error:"Command data is incomplete. Enter the Host key and try again."},{status:400});const {error}=await supabaseAdmin.rpc("host_transition",{p_code:p.data.code.toUpperCase(),p_host_key:p.data.hostKey,p_phase:p.data.phase,p_minutes:p.data.minutes??null});return error?NextResponse.json({error:error.message==="Unauthorized host command"?"Host key is incorrect for this room.":error.message},{status:403}):NextResponse.json({ok:true});}
