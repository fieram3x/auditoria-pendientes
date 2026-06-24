# Auditoría Pendientes

Aplicación Streamlit para gestionar incidencias de auditoría con Google Sheets como base de datos. La app fue reorganizada para funcionar como un sistema interno de control de incidencias: responsables, SLA, alertas, trazabilidad, cierre formal y reapertura.

## Módulos

- `app.py`: orquestador principal, login, estilos y navegación.
- `constants.py`: columnas, roles, estatus, prioridades, SLA y catálogos base.
- `database.py`: conexión a Google Sheets, migración automática, escrituras puntuales y bitácora.
- `auth.py`: login, bloqueo por intentos, último acceso, permisos y cambio obligatorio de contraseña.
- `components.py`: header, sidebar, filtros globales, KPIs, alertas y línea de tiempo.
- `sla.py`: cálculo de fecha compromiso, estado SLA, cumplimiento y rangos de vencimiento.
- `exports.py`: Excel filtrado con formato y PDF ejecutivo.
- `pages/dashboard.py`: dashboard ejecutivo.
- `pages/pendientes.py`: creación, edición, comentario, cierre formal, reapertura y detalle de incidencia.
- `pages/kanban.py`: vista Kanban por estatus.
- `pages/bitacora.py`: bitácora general filtrable.
- `pages/usuarios.py`: administración de usuarios, roles y bloqueos.
- `pages/catalogos.py`: mantenimiento de catálogos.
- `security.py`: hashing PBKDF2 y verificación de contraseñas.
- `ui_utils.py`: helpers de texto seguro, fechas, badges y normalización.

## Base de datos

La app mantiene la hoja de cálculo `auditoria_pendientes` y usa estas pestañas:

- `Pendientes`
- `Bitacora`
- `Usuarios`
- `Catalogos`

La migración es automática. Si una columna nueva no existe, se agrega al cargar los datos sin borrar información existente.

## Columnas principales

`Pendientes` incluye:

- `ID`
- `Fecha Creación`
- `Hotel`
- `Departamento`
- `Área Responsable`
- `Tipo de Incidencia`
- `Impacto`
- `Prioridad`
- `Estatus`
- `Responsable`
- `Usuario asignado`
- `Creado por`
- `Última actualización por`
- `Fecha asignación`
- `Fecha Compromiso`
- `Fecha Vencimiento Real`
- `Descripción`
- `Causa raíz`
- `Acción tomada`
- `Motivo de cierre`
- `Evidencia URL`
- `Comentario final`
- `Fecha Cierre`
- `Última Actualización`

`Bitacora` registra:

- Fecha y hora
- Usuario
- Acción realizada
- Campo modificado
- Valor anterior
- Valor nuevo
- Comentario
- Hotel
- Estatus

`Usuarios` incluye:

- Usuario, password, nombre, rol y estado
- Último acceso
- Intentos fallidos
- Bloqueo temporal
- Indicador para forzar cambio de contraseña

## Roles y permisos

- `Administrador`: acceso total.
- `Supervisor`: dashboard, pendientes, Kanban, bitácora, edición, cierre y reapertura.
- `Auditor`: dashboard, pendientes, Kanban, bitácora, creación, comentarios y actualización de incidencias asignadas.

## Flujo de incidencias

1. Crear incidencia con hotel, departamento, tipo, impacto, prioridad, responsable, fecha compromiso y descripción.
2. Asignar o cambiar responsable.
3. Comentar avances; cada comentario se registra en bitácora.
4. Cambiar estatus desde Pendientes o Kanban.
5. Cerrar formalmente con causa raíz, acción tomada y comentario final obligatorios.
6. Reabrir una incidencia cerrada solo con motivo obligatorio.

## SLA

La fecha compromiso se calcula por prioridad:

- Crítica: 1 día
- Alta: 2 días
- Media: 3 días
- Baja: 5 días

El dashboard clasifica vencimientos por rangos y calcula cumplimiento SLA.

## Dashboard y alertas

El dashboard incluye KPIs ejecutivos, filtros globales y gráficos por hotel, departamento, prioridad, estatus, vencimientos y tendencia mensual.

El centro de alertas muestra:

- Incidencias vencidas
- Incidencias críticas
- Incidencias que vencen hoy
- Incidencias sin responsable
- Incidencias sin actualización reciente

## Exportaciones

Las exportaciones trabajan sobre lo filtrado:

- Excel con encabezados, filtros, ancho automático y colores por prioridad/estatus.
- PDF ejecutivo con título, fecha de generación, filtros, KPIs, resumen y tabla resumida.

## Seguridad

- Contraseñas protegidas con PBKDF2.
- Migración automática de contraseñas antiguas en texto plano.
- Bloqueo por intentos fallidos.
- Auditoría de login exitoso/fallido.
- Cambio obligatorio de contraseña temporal.

## Configuración

La conexión usa:

```toml
[google_service_account]
```

en `st.secrets`.

Opcionalmente puedes definir:

```toml
initial_admin_password = "..."
```

Si no se define, se genera una contraseña temporal para el primer usuario `admin`.

## Ejecución

```bash
streamlit run app.py
```
