# Auditoría Pendientes

Aplicación web para gestionar incidencias de auditoría con **Supabase** como base de datos y **Cloudflare Pages** como hosting. Esta versión reemplaza Streamlit por una SPA moderna construida con Vite.

## Stack

- Frontend: Vite + JavaScript
- Base de datos: Supabase Postgres
- Login: usuario y contraseña propios de la app, con sesiones de corta duración
- Hosting: Cloudflare Pages
- Seguridad: RLS, escrituras transaccionales por RPC y sesión interna por token

## Estructura

- `index.html`: entrada de la app.
- `src/main.js`: lógica de autenticación, módulos, CRUD y renderizado.
- `src/domain.js`: reglas puras de SLA, métricas, paginación y contraseñas.
- `src/styles.css`: diseño visual corporativo y tablas tipo Excel.
- `supabase/schema.sql`: tablas, índices, RLS, permisos y catálogos iniciales.
- `supabase/migrations/`: migraciones aplicables con Supabase CLI.
- `test/`: pruebas automatizadas de las reglas de negocio.
- `public/_redirects`: regla SPA para Cloudflare Pages.
- `package.json`: scripts de desarrollo y build.

## Configurar Supabase

1. Crea un proyecto en Supabase.
2. Para un proyecto nuevo, abre SQL Editor y ejecuta completo:

```sql
supabase/schema.sql
```

3. Para actualizar un proyecto existente, aplica en orden los archivos de `supabase/migrations/`. La migración actual es:

```text
supabase/migrations/20260714183517_harden_incident_workflow.sql
```

También puedes usar `supabase db push` si el proyecto está enlazado con Supabase CLI. Aplica primero el SQL y publica el frontend después, porque esta versión depende de las RPC nuevas.

4. Abre la app e inicia sesión con un administrador existente. El script no crea credenciales predeterminadas. En una instalación nueva, el primer administrador debe aprovisionarse de forma controlada desde SQL Editor; después, los demás usuarios se administran desde la app.
5. Si el usuario tiene `Debe cambiar password = Sí`, la app pedirá cambiar la contraseña antes de entrar.

## Usuarios

El script no crea usuarios iniciales ni elimina usuarios existentes. Los usuarios se crean desde el módulo Usuarios y luego inician sesión con `Usuario` y `Contraseña`.

La tabla `public.app_users` guarda los accesos propios de la app: usuario, hash de contraseña, nombre, rol, estado, último acceso, intentos fallidos, bloqueo y cambio obligatorio de contraseña.

Los usuarios son globales. No se asigna división ni departamento al perfil; el acceso a divisiones y departamentos lo controla el rol y la operación normal de la app. Cuando se crean con `Debe cambiar password = Sí`, deben cambiar la contraseña en su primer inicio de sesión.

Las contraseñas se guardan únicamente como hash bcrypt. Deben tener al menos 12 caracteres, mayúscula, minúscula, número y símbolo. El frontend nunca muestra ni almacena contraseñas reales.

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

Para ejecutar las pruebas:

```bash
pnpm test
```

## Módulos

- Dashboard ejecutivo con KPIs de pendientes, vencidas, críticas y cierres en SLA; filtros rápidos y filtros activos visibles.
- Incidencias con búsqueda, filtros de columna, paginación, densidad y columnas configurables, además de exportación Excel.
- Detalle, comentario, edición, cierre formal y reapertura.
- Kanban por estatus con finalizadas ocultas opcionalmente.
- Bitácora general con carga incremental.
- Usuarios globales con filtros, roles, activación, bloqueo, restablecimiento de contraseña y registro en bitácora.
- Catálogos editables para administradores y supervisores.
- Navegación responsive, menú móvil, foco visible, etiquetas asociadas y estados de carga.

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

El frontend usa la anon key pública y envía un token interno de sesión en cada consulta. El token se mantiene en `sessionStorage`, no en `localStorage`, y se invalida por expiración, inactividad, bloqueo o cierre de sesión. La sesión dura como máximo 60 minutos y expira tras 30 minutos de inactividad.

Las lecturas están protegidas por RLS. Las escrituras directas a incidencias, bitácora y catálogos están revocadas para `anon`: se ejecutan mediante RPC con validación de token y rol. La creación de ID, el cambio y su registro de auditoría ocurren en una misma transacción de base de datos. El perfil de usuarios solo es legible por un administrador autenticado en la sesión interna.

El esquema incluye concesiones explícitas para la Data API; no depende de privilegios implícitos. No uses ni expongas una clave `service_role` en el navegador.

Roles operativos:

- `Administrador`: administra usuarios, catálogos e incidencias.
- `Supervisor`: opera incidencias y catálogos.
- `Auditor`: crea, comenta y edita incidencias propias/asignadas.
- `Consulta`: solo lectura.

El módulo Usuarios administra accesos globales, roles, activación, bloqueo y restablecimiento de contraseña. No usa división ni departamento en el perfil. Los cambios quedan registrados en bitácora.

## Comprobaciones antes de publicar

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm build
pnpm audit --prod
```

Después de aplicar la migración, valida con un usuario de cada rol: lectura, creación/edición, cierre/reapertura, catálogos y administración de usuarios. Confirma también que una sesión expirada o bloqueada ya no pueda leer datos.
