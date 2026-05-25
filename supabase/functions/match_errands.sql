create or replace function public.match_errands(
  route_id uuid,
  radius_m integer default 5000
)
returns table (
  errand_id uuid,
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
