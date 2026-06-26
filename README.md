# Auditoría Pendientes

Aplicación web para gestionar incidencias de auditoría con **Supabase** como base de datos y **Cloudflare Pages** como hosting. Esta versión reemplaza Streamlit por una SPA moderna construida con Vite.

## Stack

- Frontend: Vite + JavaScript
- Base de datos: Supabase Postgres
- Login: desactivado temporalmente para arranque administrador
- Hosting: Cloudflare Pages
- Seguridad: RLS activo en tablas públicas con token temporal de administrador directo

## Estructura

- `index.html`: entrada de la app.
- `src/main.js`: lógica de autenticación, módulos, CRUD y renderizado.
- `src/styles.css`: diseño visual corporativo y tablas tipo Excel.
- `supabase/schema.sql`: tablas, índices, RLS, permisos y catálogos iniciales.
- `public/_redirects`: regla SPA para Cloudflare Pages.
- `package.json`: scripts de desarrollo y build.

## Configurar Supabase

1. Crea un proyecto en Supabase.
2. Abre SQL Editor.
3. Ejecuta completo el archivo:

```sql
supabase/schema.sql
```

4. Abre la app. Entrará directo al módulo Usuarios como `Administrador Directo`.
5. Crea el usuario real que usará la app cuando se reactive el login.

## Usuarios

El script temporal no crea usuarios iniciales y limpia `public.app_users` para empezar desde cero. La app entra sin pantalla de login como `Administrador Directo` para que puedas crear el primer usuario desde el módulo Usuarios.

No vuelvas a ejecutar `supabase/schema.sql` después de crear usuarios reales hasta reactivar el login, porque este modo temporal vuelve a dejar la tabla de usuarios vacía.

La tabla `public.app_users` guarda los accesos propios de la app: usuario, hash de contraseña, nombre, rol, estado, último acceso, intentos fallidos, bloqueo y cambio obligatorio de contraseña.

Los usuarios son globales. No se asigna hotel ni departamento al perfil; el acceso a hoteles y departamentos lo controla el rol y la operación normal de la app.

Las contraseñas se guardan como hash. El frontend nunca muestra ni almacena contraseñas reales.

## Variables de Cloudflare Pages

Configura estas variables en Cloudflare Pages:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
```

No uses ni expongas `service_role` en el frontend.

## Deploy en Cloudflare Pages

Configuración recomendada:

- Framework preset: `Vite`
- Build command: `pnpm build`
- Build output directory: `dist`

## Desarrollo local

```bash
pnpm install
pnpm dev
```

Para build:

```bash
pnpm build
```

## Módulos

- Dashboard ejecutivo con KPIs y gráficos simples.
- Incidencias con tabla tipo Excel, filtros y exportación CSV.
- Detalle, comentario, edición, cierre formal y reapertura.
- Kanban por estatus.
- Bitácora general.
- Usuarios globales con filtros, roles, activación, bloqueo, restablecimiento de contraseña y registro en bitácora.
- Catálogos editables para administradores y supervisores.

## Migración desde Google Sheets

La tabla principal equivalente es `public.incidents`.

Mapeo sugerido:

- `ID` -> `id`
- `Fecha Creación` -> `created_at`
- `Hotel` -> `hotel`
- `Departamento` -> `department`
- `Área Responsable` -> `responsible_area`
- `Tipo de Incidencia` -> `incident_type`
- `Impacto` -> `impact`
- `Prioridad` -> `priority`
- `Estatus` -> `status`
- `Responsable` -> `responsible`
- `Fecha Compromiso` -> `due_at`
- `Fecha Vencimiento Real` -> `actual_due_at`
- `Descripción` -> `description`
- `Causa raíz` -> `root_cause`
- `Acción tomada` -> `action_taken`
- `Motivo de cierre` -> `close_reason`
- `Evidencia URL` -> `evidence_url`
- `Comentario final` -> `final_comment`
- `Fecha Cierre` -> `closed_at`
- `Última Actualización` -> `updated_at`

La bitácora equivalente es `public.audit_log`.

Mapeo sugerido:

- `ID Pendiente` -> `incident_id`
- `Fecha` -> `occurred_at`
- `Usuario` -> `legacy_user`
- `Acción` -> `action`
- `Campo modificado` -> `changed_field`
- `Valor anterior` -> `old_value`
- `Valor nuevo` -> `new_value`
- `Comentario` -> `comment`
- `Hotel` -> `hotel`
- `Estatus` -> `status`

## Seguridad

El SQL activa RLS en:

- `app_users`
- `app_sessions`
- `incidents`
- `audit_log`
- `catalogs`

El frontend usa la anon key pública y envía un token interno de sesión en cada consulta. Las políticas RLS y las RPC validan ese token antes de permitir lecturas o cambios.

Roles operativos:

- `Administrador`: administra usuarios, catálogos e incidencias.
- `Supervisor`: opera incidencias y catálogos.
- `Auditor`: crea, comenta y edita incidencias propias/asignadas.
- `Consulta`: solo lectura.

El módulo Usuarios administra accesos globales, roles, activación, bloqueo y restablecimiento de contraseña. No usa hotel ni departamento en el perfil. Los cambios quedan registrados en bitácora.
