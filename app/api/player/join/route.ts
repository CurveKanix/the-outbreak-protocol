import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
const body = z.object({ code: z.string().min(4).max(12), name: z.string().trim().min(2).max(24), recoveryPin: z.string().regex(/^\d{6}$/).optional() });
export async function POST(req: Request) { const parsed=body.safeParse(await req.json()); if(!parsed.success)return NextResponse.json({error:"Invalid admission request"},{status:400}); const {data,error}=await supabaseAdmin.rpc("join_room",{p_code:parsed.data.code.toUpperCase(),p_name:parsed.data.name,p_recovery_pin:parsed.data.recoveryPin??null}); return error?NextResponse.json({error:error.message},{status:400}):NextResponse.json(data); }
