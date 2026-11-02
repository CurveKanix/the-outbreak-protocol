import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { validAdminKey } from "@/lib/host-admin";
const body=z.object({code:z.string().trim().min(4).max(12),adminKey:z.string().trim().min(1).max(200),phase:z.enum(["lobby","night","discussion","voting","summary","game_over"]),minutes:z.number().int().min(1).max(60).nullable().optional()});
export async function POST(req:Request){const p=body.safeParse(await req.json());if(!p.success)return NextResponse.json({error:"Command data is incomplete. Sign in as Host and try again."},{status:400});if(!validAdminKey(p.data.adminKey))return NextResponse.json({error:"Host password is incorrect. Open /host to sign in again."},{status:403});const {error}=await supabaseAdmin.rpc("host_transition",{p_code:p.data.code.toUpperCase(),p_host_key:"",p_phase:p.data.phase,p_minutes:p.data.minutes??null,p_admin:true});return error?NextResponse.json({error:error.message},{status:400}):NextResponse.json({ok:true});}
