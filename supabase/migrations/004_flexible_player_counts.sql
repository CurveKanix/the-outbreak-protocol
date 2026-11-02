-- Start games with 4 to 36 players. Roles scale down for smaller wards.
create or replace function public.host_transition(p_code text,p_host_key text,p_phase public.game_phase,p_minutes int default null)
returns void language plpgsql security definer set search_path=public as $$
declare r rooms; total_players int; infected_count int; surgeon_count int; seer_count int; researcher_count int;
begin
  select * into r from rooms where code=upper(p_code) for update;
  if not found or extensions.crypt(p_host_key,r.host_key_hash)<>r.host_key_hash then raise exception 'Unauthorized host command'; end if;
  if p_phase='night' and r.phase='lobby' then
    select count(*) into total_players from players where room_id=r.id;
    if total_players < 4 then raise exception 'Need at least 4 players to start'; end if;
    infected_count := greatest(1, floor(total_players::numeric / 4)::int);
    surgeon_count := case when total_players >= 8 then 1 else 0 end;
    seer_count := case when total_players >= 10 then 1 else 0 end;
    researcher_count := case when total_players >= 14 then 1 else 0 end;
    with ranked as (select id,row_number() over(order by random()) n from players where room_id=r.id)
    update players p set role=case
      when n<=infected_count then 'infected'::game_role
      when n<=infected_count+surgeon_count then 'surgeon'::game_role
      when n<=infected_count+surgeon_count+seer_count then 'virologist'::game_role
      when n<=infected_count+surgeon_count+seer_count+researcher_count then 'researcher'::game_role
      else 'resident'::game_role end from ranked x where p.id=x.id;
  end if;
  update rooms set phase=p_phase, phase_ends_at=case when p_minutes is null then null else now()+make_interval(mins=>p_minutes) end, day_number=case when p_phase='night' then day_number+1 else day_number end where id=r.id;
end $$;
