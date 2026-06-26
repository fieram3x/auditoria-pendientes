-- Hotfix no destructivo para bases existentes.
-- Ejecutar en Supabase SQL Editor si al crear usuarios aparece un error de audit_log.

alter table public.audit_log add column if not exists incident_id text;
alter table public.audit_log add column if not exists occurred_at timestamptz not null default now();
alter table public.audit_log add column if not exists user_id uuid;
alter table public.audit_log add column if not exists legacy_user text;
alter table public.audit_log add column if not exists action text not null default 'Movimiento';
alter table public.audit_log add column if not exists changed_field text;
alter table public.audit_log add column if not exists old_value text;
alter table public.audit_log add column if not exists new_value text;
alter table public.audit_log add column if not exists comment text;
alter table public.audit_log add column if not exists hotel text;
alter table public.audit_log add column if not exists status text;
