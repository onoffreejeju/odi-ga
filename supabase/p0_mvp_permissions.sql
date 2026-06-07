-- P0 MVP permission hardening for ODI:GA.
-- Run this in Supabase SQL Editor after the base schema exists.

create or replace function public.match_errands(
  route_id uuid,
  radius_m integer default 5000
)
returns table (
  errand_id uuid,
  requester_id uuid,
  category text,
  description text,
  pickup_name text,
  pickup_lat float,
  pickup_lng float,
  detour_km float,
  requester_name text,
  requester_avatar text
) as $$
  select
    e.id,
    e.requester_id,
    e.category,
    e.description,
    e.pickup_name,
    e.pickup_lat,
    e.pickup_lng,
    st_distance(
      st_makeline(
        st_makepoint(r.origin_lng, r.origin_lat),
        st_makepoint(r.dest_lng, r.dest_lat)
      )::geography,
      st_makepoint(e.pickup_lng, e.pickup_lat)::geography
    ) / 1000 as detour_km,
    u.name,
    u.avatar_url
  from public.errands e
  join public.routes r on r.id = route_id
  join public.users u on u.id = e.requester_id
  where e.status = 'requested'
    and r.helper_id = auth.uid()
    and e.requester_id <> auth.uid()
    and st_dwithin(
      st_makepoint(e.pickup_lng, e.pickup_lat)::geography,
      st_makeline(
        st_makepoint(r.origin_lng, r.origin_lat),
        st_makepoint(r.dest_lng, r.dest_lat)
      )::geography,
      radius_m
    )
  order by detour_km asc;
$$ language sql stable security definer set search_path = public;

create or replace function public.accept_errand(
  p_errand_id uuid,
  p_route_id uuid
)
returns public.errands as $$
declare
  current_user_id uuid := auth.uid();
  accepted public.errands;
begin
  if current_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if not exists (
    select 1
    from public.routes r
    where r.id = p_route_id
      and r.helper_id = current_user_id
      and r.status = 'active'
  ) then
    raise exception '활성화된 본인 경로가 필요합니다.';
  end if;

  update public.errands e
  set
    status = 'matched',
    matched_route_id = p_route_id,
    matched_helper_id = current_user_id
  where e.id = p_errand_id
    and e.status = 'requested'
    and e.requester_id <> current_user_id
    and e.matched_route_id is null
    and e.matched_helper_id is null
  returning * into accepted;

  if not found then
    raise exception '수락할 수 없는 의뢰입니다. 이미 매칭되었거나 본인이 만든 의뢰입니다.';
  end if;

  return accepted;
end;
$$ language plpgsql volatile security definer set search_path = public;

create or replace function public.advance_errand_status(
  p_errand_id uuid,
  p_next_status text
)
returns public.errands as $$
declare
  current_user_id uuid := auth.uid();
  current_errand public.errands;
  updated_errand public.errands;
begin
  if current_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select *
  into current_errand
  from public.errands
  where id = p_errand_id
  for update;

  if not found then
    raise exception '의뢰를 찾을 수 없습니다.';
  end if;

  if current_errand.matched_helper_id is distinct from current_user_id then
    raise exception '매칭된 헬퍼만 상태를 변경할 수 있습니다.';
  end if;

  if p_next_status = 'in_progress' and current_errand.status = 'matched' then
    update public.errands
    set status = 'in_progress'
    where id = p_errand_id
    returning * into updated_errand;
  elsif p_next_status = 'completed' and current_errand.status = 'in_progress' then
    update public.errands
    set status = 'completed'
    where id = p_errand_id
    returning * into updated_errand;
  else
    raise exception '허용되지 않은 상태 전환입니다.';
  end if;

  return updated_errand;
end;
$$ language plpgsql volatile security definer set search_path = public;

grant execute on function public.match_errands(uuid, integer) to authenticated;
grant execute on function public.accept_errand(uuid, uuid) to authenticated;
grant execute on function public.advance_errand_status(uuid, text) to authenticated;
