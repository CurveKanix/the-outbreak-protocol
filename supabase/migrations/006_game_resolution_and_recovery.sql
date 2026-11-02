-- Authoritative resolution, host audit trail, and secure player recovery.
alter table public.players add column if not exists recovery_pin_hash text;
create table if not exists public.round_events (
  id uuid primary key default gen_random_uuid(), room_id uuid not null references public.rooms(id) on delete cascade,
  day_number int not null, event_type text not null, actor_id uuid references public.players(id) on delete set null,
  target_id uuid references public.players(id) on delete set null, details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.round_events enable row level security;

drop function if exists public.join_room(text,text);
create or replace function public.join_room(p_code text,p_name text,p_recovery_pin text default null) returns jsonb language plpgsql security definer set search_path=public as $$
declare r rooms; p players; generated_pin text;
begin
  select * into r from rooms where code=upper(p_code) for update; if not found then raise exception 'Room not found'; end if;
  select * into p from players where room_id=r.id and lower(display_name)=lower(trim(p_name)) limit 1;
  if found then
    if p.recovery_pin_hash is not null and (p_recovery_pin is null or extensions.crypt(p_recovery_pin,p.recovery_pin_hash)<>p.recovery_pin_hash) then raise exception 'This call sign is already in use. Enter its 6-digit recovery PIN.'; end if;
    return jsonb_build_object('sessionToken',p.session_token,'player',jsonb_build_object('id',p.id,'display_name',p.display_name,'seat',p.seat,'is_alive',p.is_alive));
  end if;
  if r.phase <> 'lobby' then raise exception 'Admissions are closed. Re-enter your original call sign and recovery PIN to reconnect.'; end if;
  if (select count(*) from players where room_id=r.id) >= 36 then raise exception 'Room is full'; end if;
  generated_pin:=lpad((floor(random()*1000000))::int::text,6,'0');
  insert into players(room_id,display_name,seat,recovery_pin_hash) values(r.id,trim(p_name),(select min(s) from generate_series(1,36)s where not exists(select 1 from players where room_id=r.id and seat=s)),extensions.crypt(generated_pin,extensions.gen_salt('bf'))) returning * into p;
  return jsonb_build_object('sessionToken',p.session_token,'recoveryPin',generated_pin,'player',jsonb_build_object('id',p.id,'display_name',p.display_name,'seat',p.seat,'is_alive',p.is_alive));
end $$;

drop function if exists public.host_transition(text,text,public.game_phase,integer,boolean);
create or replace function public.host_transition(p_code text,p_host_key text,p_phase public.game_phase,p_minutes int,p_admin boolean)
returns void language plpgsql security definer set search_path=public as $$
declare r rooms; total_players int; infected_count int; surgeon_count int; seer_count int; researcher_count int; victim uuid; protected uuid; executed uuid; top_votes int; tie_count int; victim_name text; infected_alive int; clinical_alive int;
begin
  select * into r from rooms where code=upper(p_code) for update; if not found then raise exception 'Room not found'; end if;
  if not p_admin and extensions.crypt(p_host_key,r.host_key_hash)<>r.host_key_hash then raise exception 'Unauthorized host command'; end if;
  if p_phase='discussion' and r.phase='night' then
    select i.target_id into victim from intents i join players a on a.id=i.actor_id where i.room_id=r.id and i.phase='night' and i.kind='action' and a.role='infected' group by i.target_id order by count(*) desc,i.target_id limit 1;
    select i.target_id into protected from intents i join players a on a.id=i.actor_id where i.room_id=r.id and i.phase='night' and i.kind='action' and a.role='surgeon' limit 1;
    if victim is not null and victim<>protected then update players set is_alive=false where id=victim; select display_name into victim_name from players where id=victim; insert into round_events(room_id,day_number,event_type,target_id,details) values(r.id,r.day_number,'night_elimination',victim,jsonb_build_object('name',victim_name)); update rooms set morning_log=jsonb_build_array('Overnight alert: '||victim_name||' was lost.') where id=r.id;
    elsif victim is not null then insert into round_events(room_id,day_number,event_type,target_id,details) values(r.id,r.day_number,'surgery_save',victim,'{}'); update rooms set morning_log=jsonb_build_array('Overnight alert: surgical intervention prevented a loss.') where id=r.id;
    else update rooms set morning_log=jsonb_build_array('Overnight report: no critical incidents.') where id=r.id; end if;
    insert into round_events(room_id,day_number,event_type,actor_id,target_id,details) select r.id,r.day_number,'scan',i.actor_id,i.target_id,jsonb_build_object('infected',(t.role='infected')) from intents i join players a on a.id=i.actor_id join players t on t.id=i.target_id where i.room_id=r.id and i.phase='night' and i.kind='action' and a.role='virologist';
  end if;
  if p_phase='summary' and r.phase='voting' then
    select max(c) into top_votes from (select count(*) c from intents where room_id=r.id and phase='voting' and kind='vote' group by target_id) x;
    select count(*) into tie_count from (select target_id,count(*) c from intents where room_id=r.id and phase='voting' and kind='vote' group by target_id) x where c=top_votes;
    if top_votes is not null and tie_count=1 then select target_id into executed from intents where room_id=r.id and phase='voting' and kind='vote' group by target_id order by count(*) desc limit 1; update players set is_alive=false where id=executed; select display_name into victim_name from players where id=executed; insert into round_events(room_id,day_number,event_type,target_id,details) values(r.id,r.day_number,'execution',executed,jsonb_build_object('name',victim_name,'votes',top_votes)); update rooms set morning_log=morning_log||jsonb_build_array('Vote result: '||victim_name||' was removed from the ward.') where id=r.id;
    else insert into round_events(room_id,day_number,event_type,details) values(r.id,r.day_number,'vote_tie','{}'); update rooms set morning_log=morning_log||jsonb_build_array('Vote result: no consensus; no one was removed.') where id=r.id; end if;
  end if;
  if p_phase='night' and r.phase='lobby' then
    select count(*) into total_players from players where room_id=r.id; if total_players<4 then raise exception 'Need at least 4 players to start'; end if;
    infected_count:=greatest(1,floor(total_players::numeric/4)::int); surgeon_count:=case when total_players>=8 then 1 else 0 end; seer_count:=case when total_players>=10 then 1 else 0 end; researcher_count:=case when total_players>=14 then 1 else 0 end;
    with ranked as (select id,row_number() over(order by random()) n from players where room_id=r.id) update players p set role=case when n<=infected_count then 'infected'::game_role when n<=infected_count+surgeon_count then 'surgeon'::game_role when n<=infected_count+surgeon_count+seer_count then 'virologist'::game_role when n<=infected_count+surgeon_count+seer_count+researcher_count then 'researcher'::game_role else 'resident'::game_role end from ranked x where p.id=x.id;
  end if;
  select count(*) filter(where role='infected' and is_alive),count(*) filter(where role<>'infected' and is_alive) into infected_alive,clinical_alive from players where room_id=r.id;
  if r.phase<>'lobby' and (infected_alive=0 or infected_alive>=clinical_alive) then p_phase:='game_over'; update rooms set morning_log=morning_log||jsonb_build_array(case when infected_alive=0 then 'GAME OVER: Medical staff contained the outbreak.' else 'GAME OVER: The infection has overwhelmed the ward.' end) where id=r.id; end if;
  update rooms set phase=p_phase,phase_ends_at=case when p_minutes is null or p_phase='game_over' then null else now()+make_interval(mins=>p_minutes) end,day_number=case when p_phase='night' then day_number+1 else day_number end where id=r.id;
end $$;
