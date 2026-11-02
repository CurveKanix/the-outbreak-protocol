import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
const body=z.object({code:z.string().min(4).max(12),sessionToken:z.string().uuid(),targetPlayerId:z.string().uuid(),kind:z.enum(["action","vote"])});
export async function POST(req:Request){const p=body.safeParse(await req.json());if(!p.success)return NextResponse.json({error:"Invalid request"},{status:400});const {data,error}=await supabaseAdmin.rpc("submit_intent",{p_code:p.data.code.toUpperCase(),p_session:p.data.sessionToken,p_target:p.data.targetPlayerId,p_kind:p.data.kind});return error?NextResponse.json({error:error.message},{status:400}):NextResponse.json(data);}
