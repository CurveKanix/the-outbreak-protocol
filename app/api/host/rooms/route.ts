import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { validAdminKey } from "@/lib/host-admin";
const input=z.object({adminKey:z.string().min(1)});
export async function POST(req:Request){const p=input.safeParse(await req.json());if(!p.success||!validAdminKey(p.success?p.data.adminKey:undefined))return NextResponse.json({error:"Host Admin key is incorrect"},{status:403});const {data,error}=await supabaseAdmin.from("rooms").select("id,code,phase,game_mode,day_number,created_at,players(count)").order("created_at",{ascending:false});return error?NextResponse.json({error:error.message},{status:400}):NextResponse.json({rooms:data});}
export async function DELETE(req:Request){const p=z.object({adminKey:z.string().min(1),code:z.string().min(4).max(12)}).safeParse(await req.json());if(!p.success||!validAdminKey(p.success?p.data.adminKey:undefined))return NextResponse.json({error:"Host Admin key is incorrect"},{status:403});const {error}=await supabaseAdmin.from("rooms").delete().eq("code",p.data.code.toUpperCase());return error?NextResponse.json({error:error.message},{status:400}):NextResponse.json({ok:true});}
