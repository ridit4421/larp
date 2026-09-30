-- Run this whole file once in Supabase -> SQL Editor

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  role text not null default 'viewer' check (role in ('admin','officer','viewer')),
  created_at timestamptz default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email) values (new.id, new.email) on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.has_role(r text[]) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = any(r));
$$;

create table if not exists audit_logs (
  id bigint generated always as identity primary key,
  at timestamptz default now(),
  actor text, action text, detail text
);

create table if not exists automation_rules (
  id bigint generated always as identity primary key,
  name text not null,
  trigger text not null check (trigger in ('score_gte','legal_gte','approval_gte','comp_lte')),
  threshold int not null,
  level text not null default 'warning' check (level in ('info','warning','critical')),
  action text not null,
  enabled boolean not null default true
);

create table if not exists alerts (
  id bigint generated always as identity primary key,
  project_id text, project_name text,
  rule_id bigint, rule_name text,
  level text, score int, driver text, recommendation text,
  status text not null default 'open' check (status in ('open','acknowledged','resolved')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists model_versions (
  version int primary key,
  accuracy float, trained_on int,
  weights jsonb,
  batch_seed int, batch_size int, drift float,
  created_by text,
  created_at timestamptz default now()
);

insert into automation_rules (name, trigger, threshold, level, action)
select * from (values
  ('Critical risk auto-escalation','score_gte',80,'critical','Escalate to District Collector'),
  ('High risk watchlist','score_gte',60,'warning','Add to weekly Project Director review'),
  ('Legal dispute cluster','legal_gte',4,'warning','Route to special legal cell'),
  ('Approval stalled 300+ days','approval_gte',300,'warning','Trigger single-window clearance'),
  ('Compensation lagging','comp_lte',20,'info','Schedule compensation disbursement camp')
) v(name, trigger, threshold, level, action)
where not exists (select 1 from automation_rules);

alter table profiles enable row level security;
alter table audit_logs enable row level security;
alter table automation_rules enable row level security;
alter table alerts enable row level security;
alter table model_versions enable row level security;

create policy "profiles read" on profiles for select using (id = auth.uid() or has_role(array['admin']));
create policy "profiles admin update" on profiles for update using (has_role(array['admin'])) with check (has_role(array['admin']));

create policy "audit read" on audit_logs for select using (has_role(array['admin','officer']));
create policy "audit insert" on audit_logs for insert with check (auth.uid() is not null);

create policy "rules read" on automation_rules for select using (auth.uid() is not null);
create policy "rules admin write" on automation_rules for all using (has_role(array['admin'])) with check (has_role(array['admin']));

create policy "alerts read" on alerts for select using (auth.uid() is not null);
create policy "alerts insert" on alerts for insert with check (has_role(array['admin','officer']));
create policy "alerts update" on alerts for update using (has_role(array['admin','officer'])) with check (has_role(array['admin','officer']));

create policy "models read" on model_versions for select using (auth.uid() is not null);
create policy "models admin insert" on model_versions for insert with check (has_role(array['admin']));

-- AFTER you sign up once in the app, make yourself admin (replace the email):
-- update profiles set role = 'admin' where email = 'you@example.com';
