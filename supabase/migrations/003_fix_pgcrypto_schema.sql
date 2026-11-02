-- Fix for Supabase projects where pgcrypto functions live in the `extensions` schema.
-- Safe to run after 001 and 002.
create extension if not exists pgcrypto with schema extensions;

create or replace function public.create_host_room(p_code text, p_host_key text, p_mode public.game_mode)
returns jsonb language plpgsql security definer set search_path=public as $$
declare r rooms;
begin
  insert into rooms(code, host_key_hash, game_mode)
  values (upper(p_code), extensions.crypt(p_host_key, extensions.gen_salt('bf')), p_mode)
  returning * into r;
  return jsonb_build_object('code', r.code, 'game_mode', r.game_mode);
end $$;

create or replace function public.host_transition(p_code text,p_host_key text,p_phase public.game_phase,p_minutes int default null)
returns void language plpgsql security definer set search_path=public as $$
declare r rooms;
begin
  select * into r from rooms where code=upper(p_code) for update;
  if not found or extensions.crypt(p_host_key,r.host_key_hash)<>r.host_key_hash then
    raise exception 'Unauthorized host command';
  end if;
  if p_phase='night' and r.phase='lobby' then
    if (select count(*) from players where room_id=r.id)<>36 then raise exception 'Need exactly 36 players'; end if;
    with ranked as (select id,row_number() over(order by random()) n from players where room_id=r.id)
    update players p set role=case when n<=3 then 'virologist'::game_role when n<=6 then 'surgeon'::game_role when n<=14 then 'infected'::game_role when n<=18 then 'researcher'::game_role else 'resident'::game_role end from ranked x where p.id=x.id;
  end if;
  update rooms set phase=p_phase, phase_ends_at=case when p_minutes is null then null else now()+make_interval(mins=>p_minutes) end, day_number=case when p_phase='night' then day_number+1 else day_number end where id=r.id;
end $$;
