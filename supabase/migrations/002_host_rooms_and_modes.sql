-- Run after 001_outbreak_protocol.sql
create type public.game_mode as enum ('automatic','manual','guided');
alter table public.rooms add column game_mode public.game_mode not null default 'guided';

create or replace function public.create_host_room(p_code text, p_host_key text, p_mode public.game_mode)
returns jsonb language plpgsql security definer set search_path=public as $$
declare r rooms;
begin
  insert into rooms(code, host_key_hash, game_mode)
  values (upper(p_code), crypt(p_host_key, gen_salt('bf')), p_mode) returning * into r;
  return jsonb_build_object('code', r.code, 'game_mode', r.game_mode);
end $$;

create or replace function public.public_room_snapshot(p_code text) returns jsonb language sql security definer set search_path=public as $$
 select jsonb_build_object('room',jsonb_build_object('id',r.id,'code',r.code,'phase',r.phase,'game_mode',r.game_mode,'phase_ends_at',r.phase_ends_at,'day_number',r.day_number,'morning_log',r.morning_log),'players',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'display_name',p.display_name,'seat',p.seat,'is_alive',p.is_alive,'has_acted',exists(select 1 from intents i where i.actor_id=p.id and i.phase=r.phase and i.kind='action'),'has_voted',exists(select 1 from intents i where i.actor_id=p.id and i.phase=r.phase and i.kind='vote')) order by p.seat) from players p where p.room_id=r.id),'[]'::jsonb)) from rooms r where r.code=upper(p_code); $$;

grant execute on function public.create_host_room(text,text,public.game_mode) to service_role;
