-- Supabase schema for client onboarding portal

create extension if not exists pgcrypto;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  industry text,
  business_type text,
  country text,
  timezone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_members (
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('client_admin','client_member','agency_admin','agency_member','viewer')),
  primary key (company_id, user_id),
  created_at timestamptz not null default now()
);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  email text not null,
  role text not null default 'client_member',
  token text not null unique,
  accepted boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  label text not null,
  active boolean not null default true
);

insert into public.services (key,label)
values
('seo','SEO'),
('ppc','PPC'),
('social','Social Media'),
('analytics','Analytics and Tagging'),
('webdev','Website Development'),
('email','Email Marketing'),
('cro','Conversion Rate Optimization'),
('local','Local SEO and Listings')
on conflict (key) do nothing;

create table if not exists public.company_services (
  company_id uuid references public.companies(id) on delete cascade,
  service_id uuid references public.services(id) on delete restrict,
  status text not null default 'selected',
  primary key (company_id, service_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.questionnaires (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  version int not null default 1,
  selected_services text[] not null,
  status text not null default 'in_progress',
  started_by uuid,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists questionnaire_company_status_idx
  on public.questionnaires (company_id, status);

create table if not exists public.questionnaire_responses (
  id uuid primary key default gen_random_uuid(),
  questionnaire_id uuid references public.questionnaires(id) on delete cascade,
  section_key text not null,
  responses jsonb not null default '{}',
  updated_by uuid,
  updated_at timestamptz not null default now(),
  unique(questionnaire_id, section_key)
);

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  kind text not null,
  external_id text,
  meta jsonb default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  bucket text not null,
  path text not null,
  label text,
  kind text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.secrets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  label text not null,
  secret_type text not null,
  encrypted_value bytea not null,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigserial primary key,
  actor uuid,
  company_id uuid,
  action text not null,
  target_type text,
  target_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.invites enable row level security;
alter table public.company_services enable row level security;
alter table public.questionnaires enable row level security;
alter table public.questionnaire_responses enable row level security;
alter table public.integrations enable row level security;
alter table public.assets enable row level security;
alter table public.secrets enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.is_member(company uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from public.company_members m
    where m.company_id = company and m.user_id = auth.uid()
  );
$$;

create policy companies_select on public.companies
for select using (public.is_member(id));

create policy companies_insert on public.companies
for insert with check (true);

create policy companies_update on public.companies
for update using (public.is_member(id));

create policy company_services_select on public.company_services
for select using (public.is_member(company_id));

create policy company_services_modify on public.company_services
for all using (public.is_member(company_id))
with check (public.is_member(company_id));

create policy questionnaires_select on public.questionnaires
for select using (public.is_member(company_id));

create policy questionnaires_modify on public.questionnaires
for all using (public.is_member(company_id))
with check (public.is_member(company_id));

create policy questionnaire_responses_select on public.questionnaire_responses
for select using (
  public.is_member((select company_id from public.questionnaires q where q.id = questionnaire_id))
);

create policy questionnaire_responses_modify on public.questionnaire_responses
for all using (
  public.is_member((select company_id from public.questionnaires q where q.id = questionnaire_id))
) with check (
  public.is_member((select company_id from public.questionnaires q where q.id = questionnaire_id))
);

create policy integrations_select on public.integrations
for select using (public.is_member(company_id));

create policy integrations_modify on public.integrations
for all using (public.is_member(company_id))
with check (public.is_member(company_id));

create policy assets_select on public.assets
for select using (public.is_member(company_id));

create policy assets_modify on public.assets
for all using (public.is_member(company_id))
with check (public.is_member(company_id));
