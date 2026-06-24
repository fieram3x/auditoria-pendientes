from datetime import date

import pandas as pd
import streamlit as st

from auth import can_access_page
from constants import (
    ADMIN_ROLE,
    APP_TITLE,
    AUDITOR_ROLE,
    CLOSED_STATUS,
    KANBAN_STATUSES,
    PRIORITIES,
    SUPERVISOR_ROLE,
)
from database import responsible_options
from sla import add_sla_columns, parse_any_date, sla_info
from ui_utils import badge, html_text, normalize_text, safe_date, shorten


def render_global_styles():
    st.markdown(
        """
<style>
:root{
    --primary:#2563eb;
    --primary-2:#1d4ed8;
    --bg:#f5f8fc;
    --surface:#ffffff;
    --surface-2:#f8fbff;
    --border:#dbe7f5;
    --text:#0f172a;
    --muted:#64748b;
    --green:#16a34a;
    --yellow:#ca8a04;
    --orange:#ea580c;
    --red:#dc2626;
    --blue:#2563eb;
    --shadow:0 10px 28px rgba(15,23,42,.07);
}
.stApp{
    background:linear-gradient(180deg,#f8fbff 0%,var(--bg) 42%,#eef4ff 100%);
    color:var(--text);
}
.block-container{padding-top:1rem;padding-bottom:2rem;max-width:1540px;}
[data-testid="stSidebar"]{
    background:#fff;
    border-right:1px solid var(--border);
    box-shadow:5px 0 22px rgba(15,23,42,.035);
}
[data-testid="stSidebar"] *{color:#0f172a;}
[data-testid="stToolbar"], .stDeployButton{display:none!important;}
.app-shell{
    background:rgba(255,255,255,.9);
    border:1px solid var(--border);
    border-radius:18px;
    padding:16px 18px;
    box-shadow:var(--shadow);
    margin-bottom:14px;
}
.app-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;}
.brand{display:flex;align-items:center;gap:.75rem;}
.logo{
    width:42px;height:42px;border-radius:14px;background:linear-gradient(135deg,#2563eb,#60a5fa);
    color:white;display:flex;align-items:center;justify-content:center;font-size:22px;
    box-shadow:0 10px 22px rgba(37,99,235,.22);
}
.title h1{font-size:24px;margin:0;line-height:1.05;color:#0f172a;font-weight:900;}
.title p{margin:3px 0 0;color:#64748b;font-size:13px;}
.user-pill{
    background:#fff;border:1px solid var(--border);border-radius:999px;padding:8px 13px;
    color:#334155;box-shadow:0 1px 5px rgba(15,23,42,.05);font-size:13px;white-space:nowrap;
}
.section-title{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin:0 0 10px;}
.section-title h2{margin:0;font-size:22px;font-weight:900;color:#0f172a;}
.section-title p{margin:3px 0 0;color:#64748b;font-size:13px;}
.filter-box,.detail-card,.user-panel,.edit-panel,.alert-card{
    background:#fff;border:1px solid var(--border);border-radius:16px;padding:15px;
    box-shadow:0 3px 14px rgba(15,23,42,.045);margin:.4rem 0 .8rem;
}
.kpi-card{
    background:#fff;border:1px solid var(--border);border-radius:16px;padding:15px 16px;
    box-shadow:0 3px 13px rgba(15,23,42,.045);min-height:104px;
}
.kpi-label{font-size:12px;color:#64748b;font-weight:800;text-transform:uppercase;letter-spacing:.25px;margin-bottom:8px;}
.kpi-value{font-size:25px;font-weight:950;color:#0f172a;line-height:1.05;overflow-wrap:anywhere;}
.kpi-sub{font-size:12px;color:#64748b;margin-top:8px;}
.badge{
    display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:4px 9px;
    font-size:11px;font-weight:850;border:1px solid #e5edf7;background:#f8fbff;color:#334155;line-height:1.2;
}
.badge-crítica,.badge-critica{background:#fee2e2;color:#991b1b;border-color:#fecaca;}
.badge-alta{background:#ffedd5;color:#9a3412;border-color:#fed7aa;}
.badge-media{background:#fef9c3;color:#854d0e;border-color:#fde68a;}
.badge-baja{background:#dcfce7;color:#166534;border-color:#bbf7d0;}
.badge-cerrado,.badge-resuelto,.badge-cerrado-en-sla{background:#dcfce7;color:#166534;border-color:#bbf7d0;}
.badge-cerrado-fuera-sla,.badge-vencido-1d,.badge-vencido-2d,.badge-vencido-3d,.badge-vencido-4d,.badge-vencido-5d{background:#fee2e2;color:#991b1b;border-color:#fecaca;}
span[class*="badge-vencido"]{background:#fee2e2;color:#991b1b;border-color:#fecaca;}
.badge-pendiente{background:#f1f5f9;color:#334155;border-color:#e2e8f0;}
.badge-en-proceso{background:#dbeafe;color:#1e40af;border-color:#bfdbfe;}
.badge-en-espera-de-respuesta{background:#fef3c7;color:#92400e;border-color:#fde68a;}
.badge-escalado{background:#ede9fe;color:#5b21b6;border-color:#ddd6fe;}
.compact-table{
    border:1px solid var(--border);border-radius:16px;overflow:hidden;background:#fff;
    box-shadow:0 3px 14px rgba(15,23,42,.045);
}
.table-head{
    background:linear-gradient(180deg,#f8fbff,#edf4ff);border-bottom:1px solid var(--border);
    font-size:12px;font-weight:900;color:#334155;text-transform:uppercase;letter-spacing:.25px;padding:10px 12px;
}
.table-row{border-bottom:1px solid #eef4fb;padding:9px 12px;}
.table-row:last-child{border-bottom:0;}
.cell-muted{font-size:12px;color:#64748b;}
.cell-main{font-size:13px;color:#0f172a;font-weight:700;overflow-wrap:anywhere;}
.cell-text{font-size:13px;color:#334155;overflow-wrap:anywhere;}
.row-overdue{background:#fff7f7;}
.row-warning{background:#fffdf1;}
.alert-item{
    border:1px solid #e5edf7;border-radius:13px;padding:10px 12px;margin-top:8px;background:#f8fbff;
}
.alert-danger{background:#fff7f7;border-color:#fecaca;}
.alert-warn{background:#fffbeb;border-color:#fde68a;}
.alert-info{background:#eff6ff;border-color:#bfdbfe;}
.timeline-card{
    border-left:4px solid #2563eb;background:#fff;border:1px solid var(--border);
    border-radius:14px;padding:12px 14px;margin:10px 0;box-shadow:0 2px 10px rgba(15,23,42,.035);
}
.kanban-board{display:grid;grid-template-columns:repeat(6,minmax(210px,1fr));gap:12px;overflow-x:auto;padding-bottom:8px;}
.kanban-column{
    min-height:520px;background:#fff;border:1px solid var(--border);border-radius:16px;padding:12px;
    box-shadow:0 3px 13px rgba(15,23,42,.045);
}
.kanban-title{display:flex;align-items:center;justify-content:space-between;font-weight:900;margin-bottom:10px;color:#0f172a;}
.kanban-card{
    border:1px solid #e5edf7;border-radius:14px;padding:11px;margin-bottom:10px;background:#f8fbff;
}
.kanban-card.overdue{background:#fff7f7;border-color:#fecaca;}
.kanban-card.warning{background:#fffbeb;border-color:#fde68a;}
div.stButton > button, div.stDownloadButton > button{
    border-radius:10px!important;font-weight:800!important;border:1px solid #d1d5db!important;
}
div[data-testid="stPopover"] button{border-radius:9px!important;}
@media (max-width:900px){
    .title h1{font-size:20px;}
    .kpi-value{font-size:21px;}
    .app-shell,.filter-box,.detail-card{padding:12px;}
    .kanban-board{grid-template-columns:repeat(6,240px);}
}
</style>
""",
        unsafe_allow_html=True,
    )


def header():
    st.markdown(
        f"""
        <div class="app-shell">
            <div class="app-header">
                <div class="brand">
                    <div class="logo">🛡️</div>
                    <div class="title">
                        <h1>{html_text(APP_TITLE)}</h1>
                        <p>Sistema de gestión de incidencias de auditoría</p>
                    </div>
                </div>
                <div class="user-pill">👤 {html_text(st.session_state.get("name", "Usuario"))} · {html_text(st.session_state.get("role", ""))}</div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def sidebar_nav():
    st.sidebar.markdown("### 🛡️ Auditoría")
    st.sidebar.caption("Panel de control")

    if "page" not in st.session_state:
        st.session_state.page = "Dashboard"

    all_pages = [
        ("Dashboard", "📊"),
        ("Pendientes", "📋"),
        ("Kanban", "🧩"),
        ("Bitácora", "🧾"),
        ("Usuarios", "👥"),
        ("Catálogos", "⚙️"),
    ]
    pages = [(page, icon) for page, icon in all_pages if can_access_page(page)]

    for page, icon in pages:
        if st.sidebar.button(
            f"{icon} {page}",
            use_container_width=True,
            type="primary" if st.session_state.page == page else "secondary",
        ):
            if st.session_state.page != page:
                for key in ["edit_id", "detail_id", "comment_id", "close_id", "reopen_id", "show_create"]:
                    st.session_state.pop(key, None)
            st.session_state.page = page
            st.rerun()

    st.sidebar.markdown("---")
    st.sidebar.caption(f"Usuario: {st.session_state.get('user', '')}")
    st.sidebar.caption(f"Rol: {st.session_state.get('role', '')}")

    if st.sidebar.button("Cerrar sesión", use_container_width=True):
        for key in list(st.session_state.keys()):
            del st.session_state[key]
        st.rerun()

    return st.session_state.page


def page_title(title, subtitle="", button_label=None, button_key=None, button_disabled=False):
    left, right = st.columns([1, .22])
    with left:
        st.markdown(
            f"""
            <div class="section-title">
                <div>
                    <h2>{html_text(title)}</h2>
                    <p>{html_text(subtitle)}</p>
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    if button_label and button_key:
        with right:
            return st.button(
                button_label,
                type="primary",
                use_container_width=True,
                key=button_key,
                disabled=button_disabled,
            )
    return False


def kpi_cards(values, columns=5):
    for chunk_start in range(0, len(values), columns):
        cols = st.columns(min(columns, len(values) - chunk_start))
        for col, item in zip(cols, values[chunk_start:chunk_start + columns]):
            label, value, sub = item[:3]
            with col:
                st.markdown(
                    f"""
                    <div class="kpi-card">
                        <div class="kpi-label">{html_text(label)}</div>
                        <div class="kpi-value">{html_text(value)}</div>
                        <div class="kpi-sub">{html_text(sub)}</div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )


def _options(df, column):
    if column not in df.columns:
        return []
    vals = sorted([
        normalize_text(v)
        for v in df[column].dropna().astype(str).tolist()
        if normalize_text(v) and normalize_text(v).lower() != "nan"
    ])
    return list(dict.fromkeys(vals))


def _clean_multiselect(key, options):
    current = st.session_state.get(key, [])
    if isinstance(current, str):
        current = [] if current in ["Todos", ""] else [current]
    valid = [item for item in current if item in options]
    if valid != current:
        st.session_state[key] = valid
    return valid


def clear_filter_keys(prefix):
    keys = [
        f"{prefix}_hotel",
        f"{prefix}_depto",
        f"{prefix}_tipo",
        f"{prefix}_prioridad",
        f"{prefix}_estatus",
        f"{prefix}_responsable",
        f"{prefix}_texto",
        f"{prefix}_fecha_desde",
        f"{prefix}_fecha_hasta",
    ]
    for key in keys:
        if key.endswith(("fecha_desde", "fecha_hasta")):
            st.session_state[key] = None
        elif key.endswith("texto"):
            st.session_state[key] = ""
        else:
            st.session_state[key] = []


def incident_filters(df, data=None, prefix="f", include_responsable=True, show_export_note=True):
    st.markdown('<div class="filter-box">', unsafe_allow_html=True)
    selected = {}

    row1 = st.columns([1.05, 1.05, 1.25, .85, .9, 1.1 if include_responsable else .01])
    filter_columns = [
        ("Hotel", f"{prefix}_hotel", row1[0]),
        ("Departamento", f"{prefix}_depto", row1[1]),
        ("Tipo de Incidencia", f"{prefix}_tipo", row1[2]),
        ("Prioridad", f"{prefix}_prioridad", row1[3]),
        ("Estatus", f"{prefix}_estatus", row1[4]),
    ]

    if include_responsable:
        filter_columns.append(("Responsable", f"{prefix}_responsable", row1[5]))

    for column, key, col in filter_columns:
        with col:
            options = responsible_options(data) if column == "Responsable" and data else _options(df, column)
            selected[column] = st.multiselect(
                column,
                options,
                default=_clean_multiselect(key, options),
                placeholder="Todos",
                key=key,
            )

    row2 = st.columns([1.25, .9, .9, .8, .8, 1.4])
    with row2[0]:
        texto = st.text_input("Buscar", placeholder="ID, descripción, comentario...", key=f"{prefix}_texto")
    with row2[1]:
        fecha_desde = st.date_input("Fecha desde", value=st.session_state.get(f"{prefix}_fecha_desde", None), key=f"{prefix}_fecha_desde")
    with row2[2]:
        fecha_hasta = st.date_input("Fecha hasta", value=st.session_state.get(f"{prefix}_fecha_hasta", None), key=f"{prefix}_fecha_hasta")
    with row2[3]:
        st.button("Limpiar", use_container_width=True, key=f"{prefix}_clear", on_click=clear_filter_keys, args=(prefix,))

    dff = df.copy()
    for column, values in selected.items():
        if values and column in dff.columns:
            dff = dff[dff[column].astype(str).isin([str(v) for v in values])]

    if "Fecha Creación" in dff.columns and (fecha_desde or fecha_hasta):
        fechas = pd.to_datetime(dff["Fecha Creación"], errors="coerce").dt.date
        mask = pd.Series(True, index=dff.index)
        if fecha_desde:
            mask &= fechas >= fecha_desde
        if fecha_hasta:
            mask &= fechas <= fecha_hasta
        dff = dff[mask]

    if texto:
        query = texto.lower().strip()
        mask = dff.astype(str).apply(lambda row: row.str.lower().str.contains(query, na=False).any(), axis=1)
        dff = dff[mask]

    active_filters = sum(len(v) for v in selected.values()) + bool(texto) + bool(fecha_desde) + bool(fecha_hasta)
    with row2[5]:
        if show_export_note:
            st.markdown(
                f'<div class="cell-muted" style="margin-top:8px;text-align:right;">Filtros activos: <b>{active_filters}</b> · Mostrando <b>{len(dff)}</b></div>',
                unsafe_allow_html=True,
            )

    st.markdown("</div>", unsafe_allow_html=True)
    return dff, {
        "seleccion": selected,
        "texto": texto,
        "fecha_desde": fecha_desde,
        "fecha_hasta": fecha_hasta,
        "activos": active_filters,
    }


def format_filter_summary(filters):
    selected = filters.get("seleccion", {})
    parts = []
    for key, values in selected.items():
        parts.append(f"{key}: {', '.join(values) if values else 'Todos'}")
    parts.append(f"Desde: {filters.get('fecha_desde') or 'Todas'}")
    parts.append(f"Hasta: {filters.get('fecha_hasta') or 'Todas'}")
    parts.append(f"Buscar: {filters.get('texto') or 'Sin búsqueda'}")
    return parts


def alert_center(df, max_items=8):
    dff = add_sla_columns(df)
    if dff.empty:
        return
    open_df = dff[~dff["Estatus"].astype(str).isin(CLOSED_STATUS)].copy()
    if open_df.empty:
        return

    alerts = []
    today = pd.Timestamp(date.today())
    for _, row in open_df.iterrows():
        info = sla_info(row)
        priority = normalize_text(row.get("Prioridad", ""))
        responsible = normalize_text(row.get("Responsable", ""))
        updated = parse_any_date(row.get("Última Actualización", ""))

        if info["class"] == "overdue":
            alerts.append((0, "alert-danger", "Vencida", row, info))
        elif info["days"] == 0:
            alerts.append((1, "alert-warn", "Vence hoy", row, info))
        if priority in ["Crítica", "Critica"]:
            alerts.append((2, "alert-danger", "Crítica", row, info))
        if not responsible:
            alerts.append((3, "alert-info", "Sin responsable", row, info))
        if not pd.isna(updated) and int((today - updated.normalize()).days) >= 7:
            alerts.append((4, "alert-warn", "Sin actualización reciente", row, info))

    if not alerts:
        return

    alerts = sorted(alerts, key=lambda item: item[0])[:max_items]
    st.markdown('<div class="alert-card"><div class="kpi-label">Centro de alertas</div>', unsafe_allow_html=True)
    for _, css_class, label, row, info in alerts:
        st.markdown(
            f"""
            <div class="alert-item {css_class}">
                <div class="cell-main">{html_text(label)} · {html_text(row.get("ID", ""))} · {badge(row.get("Prioridad", ""))} {badge(info["label"])}</div>
                <div class="cell-muted">{html_text(row.get("Hotel", ""))} · {html_text(row.get("Departamento", ""))} · Responsable: {html_text(row.get("Responsable", "") or "Sin asignar")}</div>
                <div class="cell-text">{html_text(shorten(row.get("Descripción", ""), 130))}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    st.markdown("</div>", unsafe_allow_html=True)


def render_timeline(bit):
    if bit.empty:
        st.info("Todavía no hay movimientos registrados.")
        return
    bit = bit.sort_values("Fecha", ascending=False)
    for _, row in bit.iterrows():
        field = normalize_text(row.get("Campo modificado", ""))
        values = ""
        if field:
            values = f"{html_text(row.get('Valor anterior', ''))} → {html_text(row.get('Valor nuevo', ''))}"
        st.markdown(
            f"""
            <div class="timeline-card">
                <div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;">
                    <div class="cell-main">{html_text(row.get("Acción", ""))}</div>
                    <div class="cell-muted">{html_text(safe_date(row.get("Fecha", ""), with_time=True))}</div>
                </div>
                <div class="cell-muted">Usuario: {html_text(row.get("Usuario", ""))} · Campo: {html_text(field or "General")}</div>
                <div class="cell-text">{values}</div>
                <div class="cell-text" style="margin-top:6px;">{html_text(row.get("Comentario", ""))}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
