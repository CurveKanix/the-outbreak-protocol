import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
const body=z.object({code:z.string().min(4).max(12),sessionToken:z.string().uuid()});
export async function POST(req:Request){const p=body.safeParse(await req.json());if(!p.success)return NextResponse.json({error:"Invalid dossier request"},{status:400});const {data,error}=await supabaseAdmin.rpc("my_dossier",{p_code:p.data.code.toUpperCase(),p_session:p.data.sessionToken});return error?NextResponse.json({error:error.message},{status:403}):NextResponse.json(data);}
