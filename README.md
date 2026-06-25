# Auditoría Pendientes

Aplicación web para gestionar incidencias de auditoría con **Supabase** como base de datos y **Cloudflare Pages** como hosting. Esta versión reemplaza Streamlit por una SPA moderna construida con Vite.

## Stack

- Frontend: Vite + JavaScript
- Base de datos: Supabase Postgres
- Auth: Supabase Auth
- Hosting: Cloudflare Pages
- Seguridad: RLS activo en tablas públicas

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

4. Crea el primer usuario en Supabase Auth.
5. Copia su UUID.
6. Ejecuta el bloque final de bootstrap indicado en `supabase/schema.sql` para convertirlo en `Administrador`.

## Usuarios heredados

La app permite iniciar sesión con usuarios heredados como `R-Matos`, `B-Paredes` o `F-Peña`. La pantalla de login solo pide `Usuario` y `Contraseña`.

La tabla `public.profiles` no guarda correos. Solo guarda datos propios de la app: usuario, nombre, rol, estado, hotel y departamento.

Supabase Auth requiere un identificador técnico interno compatible con su sistema de autenticación. La app lo genera y lo oculta; los usuarios finales no lo ven ni lo usan.

Las contraseñas se configuran directamente en el panel de acceso; no se guardan en el repositorio ni en `public.profiles`.

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
- Usuarios/perfiles con filtros, roles, activación/desactivación y registro en bitácora.
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

- `profiles`
- `incidents`
- `audit_log`
- `catalogs`

El frontend usa la anon key pública y depende de Supabase Auth + RLS para limitar acciones.

Roles operativos:

- `Administrador`: administra usuarios, catálogos e incidencias.
- `Supervisor`: opera incidencias y catálogos.
- `Auditor`: crea, comenta y edita incidencias propias/asignadas.
- `Consulta`: solo lectura.

El módulo Usuarios no muestra aliases técnicos ni correos internos. Los cambios de contraseña se realizan fuera del frontend y se registran en la bitácora desde la app.
