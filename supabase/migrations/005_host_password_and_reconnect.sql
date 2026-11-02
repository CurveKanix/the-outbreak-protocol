-- Host controls every room with OUTBREAK_ADMIN_KEY through the server API.
-- Players reconnect by entering the same call sign in the same room.
drop function if exists public.host_transition(text,text,public.game_phase,integer);
create or replace function public.host_transition(p_code text,p_host_key text,p_phase public.game_phase,p_minutes int,p_admin boolean)
returns void language plpgsql security definer set search_path=public as $$
declare r rooms; total_players int; infected_count int; surgeon_count int; seer_count int; researcher_count int;
begin
  select * into r from rooms where code=upper(p_code) for update;
  if not found then raise exception 'Room not found'; end if;
  -- p_admin is set only by the server route after validating OUTBREAK_ADMIN_KEY.
  if not p_admin and extensions.crypt(p_host_key,r.host_key_hash)<>r.host_key_hash then raise exception 'Unauthorized host command'; end if;
  if p_phase='night' and r.phase='lobby' then
    select count(*) into total_players from players where room_id=r.id;
    if total_players < 4 then raise exception 'Need at least 4 players to start'; end if;
    infected_count := greatest(1, floor(total_players::numeric / 4)::int);
    surgeon_count := case when total_players >= 8 then 1 else 0 end;
    seer_count := case when total_players >= 10 then 1 else 0 end;
    researcher_count := case when total_players >= 14 then 1 else 0 end;
    with ranked as (select id,row_number() over(order by random()) n from players where room_id=r.id)
    update players p set role=case when n<=infected_count then 'infected'::game_role when n<=infected_count+surgeon_count then 'surgeon'::game_role when n<=infected_count+surgeon_count+seer_count then 'virologist'::game_role when n<=infected_count+surgeon_count+seer_count+researcher_count then 'researcher'::game_role else 'resident'::game_role end from ranked x where p.id=x.id;
  end if;
  update rooms set phase=p_phase,phase_ends_at=case when p_minutes is null then null else now()+make_interval(mins=>p_minutes) end,day_number=case when p_phase='night' then day_number+1 else day_number end where id=r.id;
end $$;

create or replace function public.join_room(p_code text,p_name text) returns jsonb language plpgsql security definer set search_path=public as $$
declare r rooms; p players;
begin
  select * into r from rooms where code=upper(p_code) for update;
  if not found then raise exception 'Room not found'; end if;
  select * into p from players where room_id=r.id and lower(display_name)=lower(trim(p_name)) limit 1;
  if found then
    return jsonb_build_object('sessionToken',p.session_token,'player',jsonb_build_object('id',p.id,'display_name',p.display_name,'seat',p.seat,'is_alive',p.is_alive));
  end if;
  if r.phase <> 'lobby' then raise exception 'Admissions are closed. Re-enter your original call sign to reconnect.'; end if;
  if (select count(*) from players where room_id=r.id) >= 36 then raise exception 'Room is full'; end if;
  insert into players(room_id,display_name,seat) values(r.id,trim(p_name),(select min(s) from generate_series(1,36)s where not exists(select 1 from players where room_id=r.id and seat=s))) returning * into p;
  return jsonb_build_object('sessionToken',p.session_token,'player',jsonb_build_object('id',p.id,'display_name',p.display_name,'seat',p.seat,'is_alive',p.is_alive));
end $$;
