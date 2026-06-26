-- Auditoria Pendientes - Supabase schema
-- Ejecutar completo en Supabase SQL Editor.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value) values
  ('failed_login_limit', '5'),
  ('session_minutes', '720')
on conflict (key) do nothing;

create table if not exists public.app_users (
  id uuid primary key default extensions.gen_random_uuid(),
  username text not null,
  password_hash text,
  password_plain_temp text,
  display_name text not null default 'Usuario',
  role text not null default 'Auditor' check (role in ('Administrador', 'Supervisor', 'Auditor', 'Consulta')),
  status text not null default 'Activo' check (status in ('Activo', 'Inactivo')),
  hotel text,
  department text,
  last_access_at timestamptz,
  failed_attempts integer not null default 0,
  blocked boolean not null default false,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_users add column if not exists username text;
alter table public.app_users add column if not exists password_hash text;
alter table public.app_users add column if not exists password_plain_temp text;
alter table public.app_users add column if not exists display_name text not null default 'Usuario';
alter table public.app_users add column if not exists role text not null default 'Auditor';
alter table public.app_users add column if not exists status text not null default 'Activo';
alter table public.app_users add column if not exists hotel text;
alter table public.app_users add column if not exists department text;
alter table public.app_users add column if not exists last_access_at timestamptz;
alter table public.app_users add column if not exists failed_attempts integer not null default 0;
alter table public.app_users add column if not exists blocked boolean not null default false;
alter table public.app_users add column if not exists must_change_password boolean not null default true;
alter table public.app_users add column if not exists created_at timestamptz not null default now();
alter table public.app_users add column if not exists updated_at timestamptz not null default now();

do $$
begin
  alter table public.app_users drop constraint if exists app_users_role_check;
  alter table public.app_users
    add constraint app_users_role_check
    check (role in ('Administrador', 'Supervisor', 'Auditor', 'Consulta'));

  alter table public.app_users drop constraint if exists app_users_status_check;
  alter table public.app_users
    add constraint app_users_status_check
    check (status in ('Activo', 'Inactivo'));
end $$;

create unique index if not exists app_users_username_uidx
  on public.app_users (lower(username));

do $$
begin
  if to_regclass('public.profiles') is not null then
    execute $migrate$
      insert into public.app_users (
        id,
        username,
        display_name,
        role,
        status,
        hotel,
        department,
        last_access_at,
        created_at,
        updated_at
      )
      select
        id,
        coalesce(nullif(username, ''), display_name, 'Usuario'),
        coalesce(nullif(display_name, ''), username, 'Usuario'),
        coalesce(nullif(role, ''), 'Auditor'),
        coalesce(nullif(status, ''), 'Activo'),
        hotel,
        department,
        last_access_at,
        coalesce(created_at, now()),
        coalesce(updated_at, now())
      from public.profiles
      on conflict (id) do update set
        username = excluded.username,
        display_name = excluded.display_name,
        role = excluded.role,
        status = excluded.status,
        hotel = excluded.hotel,
        department = excluded.department,
        last_access_at = excluded.last_access_at,
        updated_at = now()
    $migrate$;

    execute 'drop table public.profiles cascade';
  end if;
end $$;

create table if not exists public.app_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

create index if not exists app_sessions_user_id_idx on public.app_sessions(user_id);
create index if not exists app_sessions_token_hash_idx on public.app_sessions(token_hash);
create index if not exists app_sessions_expires_at_idx on public.app_sessions(expires_at);

create table if not exists public.incidents (
  id text primary key,
  created_at timestamptz not null default now(),
  hotel text not null,
  department text not null,
  responsible_area text,
  incident_type text not null,
  subject text not null default '',
  impact text,
  priority text not null default 'Media' check (priority in ('Baja', 'Media', 'Alta', 'Crítica')),
  status text not null default 'Pendiente' check (status in ('Pendiente', 'En proceso', 'En espera de respuesta', 'Escalado', 'Resuelto', 'Cerrado')),
  responsible text,
  assigned_to uuid,
  created_by uuid,
  updated_by uuid,
  assigned_at timestamptz,
  due_at date,
  actual_due_at date,
  description text not null,
  root_cause text,
  action_taken text,
  close_reason text,
  evidence_url text,
  final_comment text,
  closed_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.incidents add column if not exists subject text not null default '';

create table if not exists public.audit_log (
  id bigint generated by default as identity primary key,
  incident_id text references public.incidents(id) on delete set null,
  occurred_at timestamptz not null default now(),
  user_id uuid,
  legacy_user text,
  action text not null,
  changed_field text,
  old_value text,
  new_value text,
  comment text,
  hotel text,
  status text
);

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

create table if not exists public.catalogs (
  id bigint generated by default as identity primary key,
  category text not null,
  value text not null,
  created_at timestamptz not null default now()
);

do $$
begin
  alter table public.incidents drop constraint if exists incidents_assigned_to_fkey;
  alter table public.incidents drop constraint if exists incidents_created_by_fkey;
  alter table public.incidents drop constraint if exists incidents_updated_by_fkey;
  alter table public.audit_log drop constraint if exists audit_log_user_id_fkey;

  alter table public.incidents
    add constraint incidents_assigned_to_fkey
    foreign key (assigned_to) references public.app_users(id) on delete set null;
  alter table public.incidents
    add constraint incidents_created_by_fkey
    foreign key (created_by) references public.app_users(id) on delete set null;
  alter table public.incidents
    add constraint incidents_updated_by_fkey
    foreign key (updated_by) references public.app_users(id) on delete set null;
  alter table public.audit_log
    add constraint audit_log_user_id_fkey
    foreign key (user_id) references public.app_users(id) on delete set null;
exception
  when duplicate_object then null;
end $$;

create unique index if not exists catalogs_category_value_uidx
  on public.catalogs (lower(category), lower(value));

insert into public.catalogs (category, value)
select 'División', value
from public.catalogs
where category = 'Hotel'
on conflict do nothing;

delete from public.catalogs
where category = 'Hotel';

create index if not exists incidents_status_idx on public.incidents(status);
create index if not exists incidents_priority_idx on public.incidents(priority);
create index if not exists incidents_due_at_idx on public.incidents(due_at);
create index if not exists incidents_created_by_idx on public.incidents(created_by);
create index if not exists incidents_assigned_to_idx on public.incidents(assigned_to);
create index if not exists audit_log_incident_id_idx on public.audit_log(incident_id);
create index if not exists audit_log_occurred_at_idx on public.audit_log(occurred_at desc);

create or replace function public.app_setting_int(p_key text, p_default integer)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif((select value from public.app_settings where key = p_key), '')::integer,
    p_default
  )
$$;

create or replace function public.app_hash_token(p_token text)
returns text
language sql
immutable
security definer
set search_path = public
as $$
  select encode(extensions.digest(coalesce(p_token, '')::text, 'sha256'::text), 'hex')
$$;

create or replace function public.app_is_direct_admin(p_token text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select false
$$;

create or replace function public.app_direct_admin_profile()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select null::jsonb
$$;

create or replace function public.app_password_matches(p_password text, p_hash text)
returns boolean
language sql
immutable
security definer
set search_path = public
as $$
  select case
    when nullif(p_hash, '') is null then false
    when p_hash like 'sha256$%' then
      split_part(p_hash, '$', 3) = encode(extensions.digest((split_part(p_hash, '$', 2) || coalesce(p_password, ''))::text, 'sha256'::text), 'hex')
    else p_hash = extensions.crypt(coalesce(p_password, ''), p_hash)
  end
$$;

create or replace function public.app_user_json(p_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', u.id,
    'username', u.username,
    'display_name', u.display_name,
    'role', u.role,
    'status', u.status,
    'hotel', u.hotel,
    'department', u.department,
    'last_access_at', u.last_access_at,
    'failed_attempts', u.failed_attempts,
    'blocked', u.blocked,
    'must_change_password', u.must_change_password,
    'created_at', u.created_at,
    'updated_at', u.updated_at
  )
  from public.app_users u
  where u.id = p_user_id
$$;

create or replace function public.app_user_id_from_token(p_token text)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if nullif(p_token, '') is null then
    return null;
  end if;

  select s.user_id
    into v_user_id
  from public.app_sessions s
  join public.app_users u on u.id = s.user_id
  where s.token_hash = public.app_hash_token(p_token)
    and s.revoked_at is null
    and s.expires_at > now()
    and u.status = 'Activo'
    and u.blocked = false
  limit 1;

  return v_user_id;
end;
$$;

create or replace function public.app_request_token()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_headers jsonb := '{}'::jsonb;
  v_headers_text text;
begin
  v_headers_text := nullif(current_setting('request.headers', true), '');
  if v_headers_text is not null then
    begin
      v_headers := v_headers_text::jsonb;
    exception
      when others then
        v_headers := '{}'::jsonb;
    end;
  end if;

  return coalesce(
    v_headers ->> 'x-app-session-token',
    v_headers ->> 'X-App-Session-Token'
  );
end;
$$;

create or replace function public.current_app_user_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_token text := public.app_request_token();
begin
  return public.app_user_id_from_token(v_token);
end;
$$;

create or replace function public.current_app_role()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  select u.role
    into v_role
  from public.app_users u
  where u.id = public.current_app_user_id()
  limit 1;

  return v_role;
end;
$$;

create or replace function public.app_login(p_username text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.app_users%rowtype;
  v_valid boolean := false;
  v_migrate_plain boolean := false;
  v_failed integer;
  v_limit integer := public.app_setting_int('failed_login_limit', 5);
  v_token text;
  v_expires_at timestamptz;
begin
  select *
    into v_user
  from public.app_users
  where lower(username) = lower(trim(coalesce(p_username, '')))
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'invalid_credentials');
  end if;

  if v_user.status <> 'Activo' then
    return jsonb_build_object('ok', false, 'reason', 'inactive');
  end if;

  if v_user.blocked then
    return jsonb_build_object('ok', false, 'reason', 'blocked');
  end if;

  if public.app_password_matches(p_password, v_user.password_hash) then
    v_valid := true;
    if v_user.password_hash like 'sha256$%' then
      v_migrate_plain := true;
    end if;
  elsif nullif(v_user.password_plain_temp, '') is not null
        and v_user.password_plain_temp = coalesce(p_password, '') then
    v_valid := true;
    v_migrate_plain := true;
  end if;

  if not v_valid then
    v_failed := coalesce(v_user.failed_attempts, 0) + 1;
    update public.app_users
       set failed_attempts = v_failed,
           blocked = case when v_failed >= v_limit then true else blocked end,
           updated_at = now()
     where id = v_user.id;

    return jsonb_build_object('ok', false, 'reason', 'invalid_credentials');
  end if;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_expires_at := now() + (public.app_setting_int('session_minutes', 720)::text || ' minutes')::interval;

  update public.app_users
     set failed_attempts = 0,
         last_access_at = now(),
         password_hash = case
           when v_migrate_plain or password_hash is null or password_hash like 'sha256$%' then extensions.crypt(coalesce(p_password, ''), extensions.gen_salt('bf'))
           else password_hash
         end,
         password_plain_temp = null,
         updated_at = now()
   where id = v_user.id
   returning * into v_user;

  insert into public.app_sessions (user_id, token_hash, expires_at)
  values (v_user.id, public.app_hash_token(v_token), v_expires_at);

  return jsonb_build_object(
    'ok', true,
    'token', v_token,
    'expires_at', v_expires_at,
    'must_change_password', v_user.must_change_password,
    'profile', public.app_user_json(v_user.id)
  );
end;
$$;

create or replace function public.app_validate_session(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := public.app_user_id_from_token(p_token);
  v_expires_at timestamptz;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'reason', 'session_expired');
  end if;

  select expires_at
    into v_expires_at
  from public.app_sessions
  where token_hash = public.app_hash_token(p_token)
    and user_id = v_user_id
    and revoked_at is null
  order by created_at desc
  limit 1;

  return jsonb_build_object(
    'ok', true,
    'expires_at', v_expires_at,
    'profile', public.app_user_json(v_user_id)
  );
end;
$$;

create or replace function public.app_logout(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.app_sessions
     set revoked_at = coalesce(revoked_at, now())
   where token_hash = public.app_hash_token(p_token)
     and revoked_at is null;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.app_change_password(
  p_token text,
  p_current_password text,
  p_new_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := public.app_user_id_from_token(p_token);
  v_user public.app_users%rowtype;
  v_valid boolean := false;
  v_expires_at timestamptz;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'reason', 'session_expired');
  end if;

  if length(coalesce(p_new_password, '')) < 8 then
    return jsonb_build_object('ok', false, 'reason', 'weak_password');
  end if;

  select * into v_user from public.app_users where id = v_user_id;

  if public.app_password_matches(p_current_password, v_user.password_hash) then
    v_valid := true;
  elsif nullif(v_user.password_plain_temp, '') is not null
        and v_user.password_plain_temp = coalesce(p_current_password, '') then
    v_valid := true;
  end if;

  if not v_valid then
    return jsonb_build_object('ok', false, 'reason', 'invalid_credentials');
  end if;

  update public.app_users
     set password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
         password_plain_temp = null,
         failed_attempts = 0,
         blocked = false,
         must_change_password = false,
         updated_at = now()
   where id = v_user_id
   returning * into v_user;

  update public.app_sessions
     set revoked_at = now()
   where user_id = v_user_id
     and token_hash <> public.app_hash_token(p_token)
     and revoked_at is null;

  select expires_at
    into v_expires_at
  from public.app_sessions
  where token_hash = public.app_hash_token(p_token)
  limit 1;

  insert into public.audit_log (
    incident_id,
    user_id,
    legacy_user,
    action,
    changed_field,
    old_value,
    new_value,
    comment,
    status
  )
  values (
    null,
    v_user_id,
    v_user.display_name,
    'Cambio de contraseña',
    'Password',
    '',
    'Actualizado',
    'El usuario actualizó su contraseña.',
    v_user.status
  );

  return jsonb_build_object(
    'ok', true,
    'expires_at', v_expires_at,
    'profile', public.app_user_json(v_user_id)
  );
end;
$$;

create or replace function public.app_admin_user_guard(p_token text)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := public.app_user_id_from_token(p_token);
  v_role text;
begin
  if v_actor_id is null then
    return null;
  end if;

  select role into v_role from public.app_users where id = v_actor_id;
  if v_role <> 'Administrador' then
    return null;
  end if;

  return v_actor_id;
end;
$$;

create or replace function public.app_save_user(
  p_token text,
  p_user_id uuid,
  p_user jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := public.app_admin_user_guard(p_token);
  v_existing public.app_users%rowtype;
  v_target public.app_users%rowtype;
  v_username text := trim(coalesce(p_user ->> 'username', ''));
  v_display_name text := trim(coalesce(p_user ->> 'display_name', ''));
  v_role text := coalesce(nullif(p_user ->> 'role', ''), 'Auditor');
  v_status text := coalesce(nullif(p_user ->> 'status', ''), 'Activo');
  v_blocked boolean := coalesce((p_user ->> 'blocked')::boolean, false);
  v_must_change boolean := coalesce((p_user ->> 'must_change_password')::boolean, true);
  v_password text := coalesce(p_user ->> 'password', '');
  v_active_admins integer;
begin
  if v_actor_id is null then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;

  if v_username = '' or v_display_name = '' then
    return jsonb_build_object('ok', false, 'reason', 'missing_required');
  end if;

  if v_role not in ('Administrador', 'Supervisor', 'Auditor', 'Consulta') then
    return jsonb_build_object('ok', false, 'reason', 'invalid_role');
  end if;

  if v_status not in ('Activo', 'Inactivo') then
    return jsonb_build_object('ok', false, 'reason', 'invalid_status');
  end if;

  if exists (
    select 1
    from public.app_users
    where lower(username) = lower(v_username)
      and (p_user_id is null or id <> p_user_id)
  ) then
    return jsonb_build_object('ok', false, 'reason', 'duplicate_username');
  end if;

  if p_user_id is null then
    if length(v_password) < 8 then
      return jsonb_build_object('ok', false, 'reason', 'weak_password');
    end if;

    insert into public.app_users (
      username,
      password_hash,
      display_name,
      role,
      status,
      blocked,
      must_change_password
    )
    values (
      v_username,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      v_display_name,
      v_role,
      v_status,
      v_blocked,
      v_must_change
    )
    returning * into v_target;

    insert into public.audit_log (user_id, legacy_user, action, changed_field, old_value, new_value, comment, status)
    values (v_actor_id, (select display_name from public.app_users where id = v_actor_id), 'Usuario creado', 'Usuario: ' || v_target.username, '', v_target.username, 'Perfil de usuario creado.', v_target.status);

    return jsonb_build_object('ok', true, 'profile', public.app_user_json(v_target.id));
  end if;

  select * into v_existing from public.app_users where id = p_user_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if p_user_id = v_actor_id and v_existing.role = 'Administrador' then
    if v_role <> 'Administrador' or v_status <> 'Activo' or v_blocked then
      return jsonb_build_object('ok', false, 'reason', 'self_admin_lockout');
    end if;
  end if;

  select count(*)
    into v_active_admins
  from public.app_users
  where id <> p_user_id
    and role = 'Administrador'
    and status = 'Activo'
    and blocked = false;

  if v_role = 'Administrador' and v_status = 'Activo' and v_blocked = false then
    v_active_admins := v_active_admins + 1;
  end if;

  if v_active_admins < 1 then
    return jsonb_build_object('ok', false, 'reason', 'last_admin');
  end if;

  update public.app_users
     set username = v_username,
         display_name = v_display_name,
         role = v_role,
         status = v_status,
         hotel = null,
         department = null,
         blocked = v_blocked,
         must_change_password = v_must_change,
         updated_at = now()
   where id = p_user_id
   returning * into v_target;

  insert into public.audit_log (user_id, legacy_user, action, changed_field, old_value, new_value, comment, status)
  values (
    v_actor_id,
    (select display_name from public.app_users where id = v_actor_id),
    'Usuario editado',
    'Usuario: ' || v_target.username,
    to_jsonb(v_existing)::text,
    public.app_user_json(v_target.id)::text,
    'Perfil de usuario actualizado.',
    v_target.status
  );

  return jsonb_build_object('ok', true, 'profile', public.app_user_json(v_target.id));
end;
$$;

create or replace function public.app_toggle_user_status(p_token text, p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := public.app_admin_user_guard(p_token);
  v_user public.app_users%rowtype;
  v_next_status text;
  v_active_admins integer;
begin
  if v_actor_id is null then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;

  select * into v_user from public.app_users where id = p_user_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  v_next_status := case when v_user.status = 'Activo' then 'Inactivo' else 'Activo' end;

  if p_user_id = v_actor_id and v_user.role = 'Administrador' and v_next_status <> 'Activo' then
    return jsonb_build_object('ok', false, 'reason', 'self_admin_lockout');
  end if;

  if v_user.role = 'Administrador' and v_next_status <> 'Activo' then
    select count(*)
      into v_active_admins
    from public.app_users
    where id <> p_user_id
      and role = 'Administrador'
      and status = 'Activo'
      and blocked = false;

    if v_active_admins < 1 then
      return jsonb_build_object('ok', false, 'reason', 'last_admin');
    end if;
  end if;

  update public.app_users
     set status = v_next_status,
         updated_at = now()
   where id = p_user_id
   returning * into v_user;

  insert into public.audit_log (user_id, legacy_user, action, changed_field, old_value, new_value, comment, status)
  values (
    v_actor_id,
    (select display_name from public.app_users where id = v_actor_id),
    case when v_next_status = 'Activo' then 'Activación de usuario' else 'Desactivación de usuario' end,
    'Usuario: ' || v_user.username,
    case when v_next_status = 'Activo' then 'Inactivo' else 'Activo' end,
    v_next_status,
    'Estado cambiado a ' || v_next_status || '.',
    v_user.status
  );

  return jsonb_build_object('ok', true, 'profile', public.app_user_json(v_user.id));
end;
$$;

create or replace function public.app_toggle_user_blocked(p_token text, p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := public.app_admin_user_guard(p_token);
  v_user public.app_users%rowtype;
  v_next_blocked boolean;
  v_active_admins integer;
begin
  if v_actor_id is null then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;

  select * into v_user from public.app_users where id = p_user_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  v_next_blocked := not v_user.blocked;

  if p_user_id = v_actor_id and v_user.role = 'Administrador' and v_next_blocked then
    return jsonb_build_object('ok', false, 'reason', 'self_admin_lockout');
  end if;

  if v_user.role = 'Administrador' and v_next_blocked then
    select count(*)
      into v_active_admins
    from public.app_users
    where id <> p_user_id
      and role = 'Administrador'
      and status = 'Activo'
      and blocked = false;

    if v_active_admins < 1 then
      return jsonb_build_object('ok', false, 'reason', 'last_admin');
    end if;
  end if;

  update public.app_users
     set blocked = v_next_blocked,
         failed_attempts = case when v_next_blocked then failed_attempts else 0 end,
         updated_at = now()
   where id = p_user_id
   returning * into v_user;

  insert into public.audit_log (user_id, legacy_user, action, changed_field, old_value, new_value, comment, status)
  values (
    v_actor_id,
    (select display_name from public.app_users where id = v_actor_id),
    case when v_next_blocked then 'Bloqueo de usuario' else 'Desbloqueo de usuario' end,
    'Usuario: ' || v_user.username,
    case when v_next_blocked then 'No' else 'Sí' end,
    case when v_next_blocked then 'Sí' else 'No' end,
    case when v_next_blocked then 'Usuario bloqueado.' else 'Usuario desbloqueado.' end,
    v_user.status
  );

  return jsonb_build_object('ok', true, 'profile', public.app_user_json(v_user.id));
end;
$$;

create or replace function public.app_admin_reset_password(
  p_token text,
  p_user_id uuid,
  p_new_password text,
  p_must_change_password boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := public.app_admin_user_guard(p_token);
  v_user public.app_users%rowtype;
begin
  if v_actor_id is null then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;

  if length(coalesce(p_new_password, '')) < 8 then
    return jsonb_build_object('ok', false, 'reason', 'weak_password');
  end if;

  update public.app_users
     set password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
         password_plain_temp = null,
         failed_attempts = 0,
         blocked = false,
         must_change_password = coalesce(p_must_change_password, true),
         updated_at = now()
   where id = p_user_id
   returning * into v_user;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  update public.app_sessions
     set revoked_at = now()
   where user_id = p_user_id
     and revoked_at is null;

  insert into public.audit_log (user_id, legacy_user, action, changed_field, old_value, new_value, comment, status)
  values (
    v_actor_id,
    (select display_name from public.app_users where id = v_actor_id),
    'Restablecimiento de contraseña',
    'Usuario: ' || v_user.username,
    '',
    'Actualizado',
    'Contraseña restablecida por administrador.',
    v_user.status
  );

  return jsonb_build_object('ok', true, 'profile', public.app_user_json(v_user.id));
end;
$$;

alter table public.app_users enable row level security;
alter table public.app_sessions enable row level security;
alter table public.incidents enable row level security;
alter table public.audit_log enable row level security;
alter table public.catalogs enable row level security;

drop policy if exists "app_users_select_session" on public.app_users;
create policy "app_users_select_session"
on public.app_users
for select
to anon
using (public.current_app_user_id() is not null);

drop policy if exists "incidents_select_session" on public.incidents;
create policy "incidents_select_session"
on public.incidents
for select
to anon
using (public.current_app_role() in ('Administrador', 'Supervisor', 'Auditor', 'Consulta'));

drop policy if exists "incidents_insert_session" on public.incidents;
create policy "incidents_insert_session"
on public.incidents
for insert
to anon
with check (
  public.current_app_role() = 'Administrador'
  or (
    created_by = public.current_app_user_id()
    and updated_by = public.current_app_user_id()
    and public.current_app_role() in ('Supervisor', 'Auditor')
  )
);

drop policy if exists "incidents_update_session" on public.incidents;
create policy "incidents_update_session"
on public.incidents
for update
to anon
using (
  public.current_app_role() in ('Administrador', 'Supervisor')
  or (
    public.current_app_role() = 'Auditor'
    and (created_by = public.current_app_user_id() or assigned_to = public.current_app_user_id())
  )
)
with check (
  public.current_app_role() = 'Administrador'
  or (
    updated_by = public.current_app_user_id()
    and (
      public.current_app_role() = 'Supervisor'
      or (
        public.current_app_role() = 'Auditor'
        and (created_by = public.current_app_user_id() or assigned_to = public.current_app_user_id())
      )
    )
  )
);

drop policy if exists "incidents_delete_admin" on public.incidents;
create policy "incidents_delete_admin"
on public.incidents
for delete
to anon
using (public.current_app_role() = 'Administrador');

drop policy if exists "audit_select_session" on public.audit_log;
create policy "audit_select_session"
on public.audit_log
for select
to anon
using (public.current_app_role() in ('Administrador', 'Supervisor', 'Auditor', 'Consulta'));

drop policy if exists "audit_insert_session" on public.audit_log;
create policy "audit_insert_session"
on public.audit_log
for insert
to anon
with check (
  public.current_app_role() = 'Administrador'
  or (
    user_id = public.current_app_user_id()
    and public.current_app_role() in ('Supervisor', 'Auditor')
  )
);

drop policy if exists "catalogs_select_session" on public.catalogs;
create policy "catalogs_select_session"
on public.catalogs
for select
to anon
using (public.current_app_role() in ('Administrador', 'Supervisor', 'Auditor', 'Consulta'));

drop policy if exists "catalogs_manage_admin_supervisor" on public.catalogs;
create policy "catalogs_manage_admin_supervisor"
on public.catalogs
for all
to anon
using (public.current_app_role() in ('Administrador', 'Supervisor'))
with check (public.current_app_role() in ('Administrador', 'Supervisor'));

drop function if exists public.app_is_direct_admin(text);
drop function if exists public.app_direct_admin_profile();

revoke all on table public.app_settings from anon;
revoke all on table public.app_users from anon;
revoke all on table public.app_sessions from anon;
revoke all on table public.incidents from anon;
revoke all on table public.audit_log from anon;
revoke all on table public.catalogs from anon;
revoke execute on all functions in schema public from public;

grant usage on schema public to anon;
grant select (
  id,
  username,
  display_name,
  role,
  status,
  hotel,
  department,
  last_access_at,
  failed_attempts,
  blocked,
  must_change_password,
  created_at,
  updated_at
) on public.app_users to anon;
grant select, insert, update, delete on public.incidents to anon;
grant select, insert on public.audit_log to anon;
grant select, insert, update, delete on public.catalogs to anon;
grant usage, select on all sequences in schema public to anon;

grant execute on function public.current_app_user_id() to anon;
grant execute on function public.current_app_role() to anon;
grant execute on function public.app_request_token() to anon;
grant execute on function public.app_login(text, text) to anon;
grant execute on function public.app_validate_session(text) to anon;
grant execute on function public.app_logout(text) to anon;
grant execute on function public.app_change_password(text, text, text) to anon;
grant execute on function public.app_save_user(text, uuid, jsonb) to anon;
grant execute on function public.app_toggle_user_status(text, uuid) to anon;
grant execute on function public.app_toggle_user_blocked(text, uuid) to anon;
grant execute on function public.app_admin_reset_password(text, uuid, text, boolean) to anon;

insert into public.catalogs (category, value) values
  ('División', '5910 - PPRL'),
  ('División', '5911 - ZEL'),
  ('División', '5917 - MPCB'),
  ('División', '5918 - MCB'),
  ('División', '5930 - PGC'),
  ('Departamento', 'Recepción'),
  ('Departamento', 'Reservas'),
  ('Departamento', 'A&B'),
  ('Departamento', 'Spa'),
  ('Departamento', 'Contabilidad'),
  ('Departamento', 'IT'),
  ('Departamento', 'Club Meliá'),
  ('Departamento', 'Auditoría Nocturna'),
  ('Departamento', 'Auditoría Diurna'),
  ('Área Responsable', 'Operaciones'),
  ('Área Responsable', 'Finanzas'),
  ('Área Responsable', 'Contabilidad'),
  ('Área Responsable', 'Revenue'),
  ('Área Responsable', 'Sistemas'),
  ('Área Responsable', 'Auditoría'),
  ('Tipo de Incidencia', 'Cobro no realizado'),
  ('Tipo de Incidencia', 'Routing incorrecto'),
  ('Tipo de Incidencia', 'Check-in mal procesado'),
  ('Tipo de Incidencia', 'Rate Code incorrecto'),
  ('Tipo de Incidencia', 'Factura no volcada a SAP'),
  ('Tipo de Incidencia', 'Diferencia POS vs PMS'),
  ('Tipo de Incidencia', 'Resort Credit incorrecto'),
  ('Tipo de Incidencia', 'HTC incorrecto'),
  ('Tipo de Incidencia', 'Falta de soporte'),
  ('Tipo de Incidencia', 'Incidencia IT'),
  ('Impacto', 'Operativo'),
  ('Impacto', 'Financiero'),
  ('Impacto', 'Contable'),
  ('Impacto', 'Cliente'),
  ('Impacto', 'Sistema'),
  ('Prioridad', 'Baja'),
  ('Prioridad', 'Media'),
  ('Prioridad', 'Alta'),
  ('Prioridad', 'Crítica'),
  ('Estatus', 'Pendiente'),
  ('Estatus', 'En proceso'),
  ('Estatus', 'En espera de respuesta'),
  ('Estatus', 'Escalado'),
  ('Estatus', 'Resuelto'),
  ('Estatus', 'Cerrado'),
  ('Causa raíz', 'Error operativo'),
  ('Causa raíz', 'Falta de soporte'),
  ('Causa raíz', 'Configuración incorrecta'),
  ('Causa raíz', 'Proceso incompleto'),
  ('Causa raíz', 'Incidencia de sistema'),
  ('Acción tomada', 'Corrección en PMS'),
  ('Acción tomada', 'Corrección contable'),
  ('Acción tomada', 'Escalamiento a IT'),
  ('Acción tomada', 'Capacitación al equipo'),
  ('Acción tomada', 'Validación documental')
on conflict do nothing;

-- El script no crea ni elimina usuarios.
-- Crea y administra usuarios desde la app con una sesion de Administrador.
