# Auditoría Pendientes - Versión mejorada

App Streamlit para gestión de pendientes e incidencias de Auditoría usando la misma base de datos en Google Sheets.

## Mejoras incluidas
- Dashboard ejecutivo con KPIs adicionales.
- Alertas operativas por SLA, vencimiento y prioridad crítica.
- SLA automático calculado por prioridad:
  - Crítica: 1 día
  - Alta: 2 días
  - Media: 3 días
  - Baja: 5 días
- Vista Kanban por estatus, sin cambiar la base de datos.
- Edición ampliada de incidencia: estatus, prioridad, fecha compromiso y descripción.
- Bitácora con historial más completo de cambios de campos.
- Mejoras visuales en tabla, prioridad, vencimientos y encabezado fijo.
- Tendencia mensual y gráfico de SLA.

## Archivos incluidos
- app.py
- requirements.txt
- runtime.txt
- .streamlit/config.toml

## Notas
La app mantiene Google Sheets como base de datos mediante `st.secrets["google_service_account"]`.
No se cambió la estructura principal de la base ni se migró a SQL.
