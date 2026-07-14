import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const schema = await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");

test("mantiene RLS activo en todas las tablas expuestas", () => {
  for (const table of ["app_users", "app_sessions", "incidents", "audit_log", "catalogs"]) {
    assert.match(schema, new RegExp(`alter table public\\.${table} enable row level security;`, "i"));
  }
});

test("no concede escrituras directas a anon", () => {
  for (const table of ["app_users", "app_sessions", "incidents", "audit_log", "catalogs"]) {
    assert.doesNotMatch(schema, new RegExp(`grant\\s+(insert|update|delete|all)[^;]*public\\.${table}[^;]*to anon`, "i"));
  }
  assert.match(schema, /revoke all on all sequences in schema public from anon;/i);
});

test("expone únicamente las RPC de escritura con validación interna", () => {
  for (const rpc of ["app_create_incident", "app_update_incident", "app_add_incident_comment", "app_save_catalog_value"]) {
    assert.match(schema, new RegExp(`create or replace function public\\.${rpc}\\(`, "i"));
    assert.match(schema, new RegExp(`grant execute on function public\\.${rpc}\\([^;]+to anon;`, "i"));
  }
});

test("limita la lectura de perfiles a administradores", () => {
  assert.match(schema, /create policy "app_users_select_admin_session"[\s\S]*?using \(\(select public\.current_app_role\(\)\) = 'Administrador'\);/i);
});
