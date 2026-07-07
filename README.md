# Auditoría Pendientes

Aplicación web para gestionar incidencias de auditoría con **Supabase** como base de datos y **Cloudflare Pages** como hosting. Esta versión reemplaza Streamlit por una SPA moderna construida con Vite.

## Stack

- Frontend: Vite + JavaScript
- Base de datos: Supabase Postgres
- Login: usuario y contraseña propios de la app
- Hosting: Cloudflare Pages
- Seguridad: RLS activo en tablas públicas con sesión interna por token

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

4. Abre la app e inicia sesión con el usuario creado en el módulo Usuarios.
5. Si el usuario tiene `Debe cambiar password = Sí`, la app pedirá cambiar la contraseña antes de entrar.

## Usuarios

El script no crea usuarios iniciales ni elimina usuarios existentes. Los usuarios se crean desde el módulo Usuarios y luego inician sesión con `Usuario` y `Contraseña`.

La tabla `public.app_users` guarda los accesos propios de la app: usuario, hash de contraseña, nombre, rol, estado, último acceso, intentos fallidos, bloqueo y cambio obligatorio de contraseña.

Los usuarios son globales. No se asigna división ni departamento al perfil; el acceso a divisiones y departamentos lo controla el rol y la operación normal de la app. Cuando se crean con `Debe cambiar password = Sí`, deben cambiar la contraseña en su primer inicio de sesión.

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
- Incidencias con tabla tipo Excel, filtros de columna y exportación Excel.
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
- `División` -> `hotel`
- `Departamento` -> `department`
- `Área Responsable` -> `responsible_area`
- `Tipo de Incidencia` -> `incident_type`
- `Asunto` -> `subject`
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
- `División` -> `hotel`
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

El módulo Usuarios administra accesos globales, roles, activación, bloqueo y restablecimiento de contraseña. No usa división ni departamento en el perfil. Los cambios quedan registrados en bitácora.
