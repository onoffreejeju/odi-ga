create extension if not exists "uuid-ossp";
create extension if not exists postgis;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar_url text,
  language text not null default 'ko',
  role text not null default 'both' check (role in ('helper', 'requester', 'both')),
  level integer not null default 1 check (level between 1 and 4),
  total_helps integer not null default 0,
  rating_avg real not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  helper_id uuid not null references public.users(id) on delete cascade,
  origin_lat double precision not null,
  origin_lng double precision not null,
  origin_name text not null,
  dest_lat double precision not null,
  dest_lng double precision not null,
  dest_name text not null,
  departure_time timestamptz not null,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.errands (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users(id) on delete cascade,
  category text not null check (category in ('delivery', 'purchase', 'pickup', 'etc')),
  description text not null,
  photo_url text,
  pickup_lat double precision not null,
  pickup_lng double precision not null,
  pickup_name text not null,
  dropoff_lat double precision not null,
  dropoff_lng double precision not null,
  dropoff_name text not null,
  status text not null default 'requested' check (status in ('requested', 'matched', 'in_progress', 'completed', 'cancelled')),
  matched_route_id uuid references public.routes(id) on delete set null,
  matched_helper_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  errand_id uuid not null references public.errands(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  type text not null default 'text' check (type in ('text', 'image', 'system')),
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  errand_id uuid not null references public.errands(id) on delete cascade,
  reviewer_id uuid not null references public.users(id) on delete cascade,
  reviewee_id uuid not null references public.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  thank_message text,
  created_at timestamptz not null default now(),
  unique (errand_id, reviewer_id, reviewee_id)
);

create index if not exists routes_helper_status_idx on public.routes(helper_id, status);
create index if not exists errands_requester_status_idx on public.errands(requester_id, status);
create index if not exists errands_matched_helper_idx on public.errands(matched_helper_id);
create index if not exists messages_errand_created_idx on public.messages(errand_id, created_at);

alter table public.users enable row level security;
alter table public.routes enable row level security;
alter table public.errands enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "Users are visible to everyone" on public.users;
create policy "Users are visible to everyone"
on public.users for select
using (true);

drop policy if exists "Users can insert own profile" on public.users;
create policy "Users can insert own profile"
on public.users for insert
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
on public.users for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Routes are visible when active or owned" on public.routes;
create policy "Routes are visible when active or owned"
on public.routes for select
using (status = 'active' or helper_id = auth.uid());

drop policy if exists "Helpers can create own routes" on public.routes;
create policy "Helpers can create own routes"
on public.routes for insert
with check (helper_id = auth.uid());

drop policy if exists "Helpers can update own routes" on public.routes;
create policy "Helpers can update own routes"
on public.routes for update
using (helper_id = auth.uid())
with check (helper_id = auth.uid());

drop policy if exists "Errands are visible when requested or involved" on public.errands;
create policy "Errands are visible when requested or involved"
on public.errands for select
using (
  status = 'requested'
  or requester_id = auth.uid()
  or matched_helper_id = auth.uid()
);

drop policy if exists "Requesters can create own errands" on public.errands;
create policy "Requesters can create own errands"
on public.errands for insert
with check (requester_id = auth.uid());

drop policy if exists "Participants can update errands" on public.errands;
create policy "Participants can update errands"
on public.errands for update
using (
  requester_id = auth.uid()
  or matched_helper_id = auth.uid()
  or exists (
    select 1 from public.routes r
    where r.id = errands.matched_route_id
      and r.helper_id = auth.uid()
  )
)
with check (
  requester_id = auth.uid()
  or matched_helper_id = auth.uid()
);

drop policy if exists "Participants can read messages" on public.messages;
create policy "Participants can read messages"
on public.messages for select
using (
  exists (
    select 1 from public.errands e
    where e.id = messages.errand_id
      and (e.requester_id = auth.uid() or e.matched_helper_id = auth.uid())
  )
);

drop policy if exists "Participants can write messages" on public.messages;
create policy "Participants can write messages"
on public.messages for insert
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.errands e
    where e.id = messages.errand_id
      and (e.requester_id = auth.uid() or e.matched_helper_id = auth.uid())
  )
);

drop policy if exists "Reviews are visible to everyone" on public.reviews;
create policy "Reviews are visible to everyone"
on public.reviews for select
using (true);

drop policy if exists "Participants can create reviews" on public.reviews;
create policy "Participants can create reviews"
on public.reviews for insert
with check (
  reviewer_id = auth.uid()
  and exists (
    select 1 from public.errands e
    where e.id = reviews.errand_id
      and e.status = 'completed'
      and (
        (e.requester_id = auth.uid() and e.matched_helper_id = reviews.reviewee_id)
        or (e.matched_helper_id = auth.uid() and e.requester_id = reviews.reviewee_id)
      )
  )
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

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

create or replace function public.refresh_user_rating(target_user_id uuid)
returns void as $$
begin
  update public.users u
  set rating_avg = coalesce((
    select avg(r.rating)::real from public.reviews r where r.reviewee_id = target_user_id
  ), 0)
  where u.id = target_user_id;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.handle_review_insert()
returns trigger as $$
begin
  perform public.refresh_user_rating(new.reviewee_id);

  update public.users
  set total_helps = total_helps + 1
  where id = new.reviewee_id;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_review_inserted on public.reviews;
create trigger on_review_inserted
after insert on public.reviews
for each row execute procedure public.handle_review_insert();
