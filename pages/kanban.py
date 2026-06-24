from datetime import datetime

import streamlit as st

from auth import can_edit_incident
from components import incident_filters, page_title
from constants import CLOSED_STATUS, KANBAN_STATUSES, SHEET_PENDIENTES
from database import apply_incident_update, clear_cache_and_rerun, get_catalog
from sla import add_sla_columns, sla_info
from ui_utils import badge, html_text, normalize_text, shorten


def _status_select_options(data):
    statuses = get_catalog(data, "Estatus", KANBAN_STATUSES)
    return [status for status in KANBAN_STATUSES if status in statuses] + [status for status in statuses if status not in KANBAN_STATUSES]


def _save_status(data, idx, row, new_status, comment, formal=None):
    old_status = normalize_text(row.get("Estatus", ""))
    updates = {"Estatus": new_status}
    formal = formal or {}

    if new_status in CLOSED_STATUS and old_status not in CLOSED_STATUS:
        updates.update({
            "Fecha Cierre": datetime.now().strftime("%Y-%m-%d"),
            "Causa raíz": formal.get("causa", ""),
            "Acción tomada": formal.get("accion", ""),
            "Comentario final": formal.get("comentario_final", ""),
        })
        action = "Cierre desde Kanban"
        comment = comment or formal.get("comentario_final", "Cierre registrado desde Kanban.")
    elif old_status in CLOSED_STATUS and new_status not in CLOSED_STATUS:
        updates["Fecha Cierre"] = ""
        action = "Reapertura desde Kanban"
        comment = f"Motivo de reapertura: {formal.get('motivo_reapertura', '')}"
    else:
        action = "Cambio de estatus desde Kanban"
        comment = comment or "Estatus actualizado desde Kanban."

    apply_incident_update(data, idx, updates, action, comment)
    clear_cache_and_rerun()


def kanban_page(data):
    page_title("Kanban", "Vista real por estatus para seguimiento operativo.")
    df = data[SHEET_PENDIENTES].copy()
    dff, _ = incident_filters(df, data=data, prefix="kanban", show_export_note=True)
    dff = add_sla_columns(dff)
    statuses = _status_select_options(data)

    st.markdown('<div class="kanban-board">', unsafe_allow_html=True)
    cols = st.columns(len(KANBAN_STATUSES))
    for col, status in zip(cols, KANBAN_STATUSES):
        col_df = dff[dff["Estatus"].astype(str).eq(status)]
        with col:
            st.markdown(
                f'<div class="kanban-column"><div class="kanban-title"><span>{html_text(status)}</span><span>{len(col_df)}</span></div>',
                unsafe_allow_html=True,
            )
            if col_df.empty:
                st.caption("Sin incidencias.")
            for idx, row in col_df.head(25).iterrows():
                info = sla_info(row)
                css = "overdue" if info["class"] == "overdue" else "warning" if info["class"] == "warning" else ""
                incident_id = str(row.get("ID", ""))
                st.markdown(
                    f"""
                    <div class="kanban-card {css}">
                        <div class="cell-main">{html_text(incident_id)}</div>
                        <div class="cell-muted">{html_text(row.get("Hotel", ""))} · {html_text(row.get("Departamento", ""))}</div>
                        <div style="margin:6px 0;">{badge(row.get("Prioridad", ""))} {badge(row.get("SLA", ""))}</div>
                        <div class="cell-muted">Responsable: {html_text(row.get("Responsable", "") or "Sin asignar")}</div>
                        <div class="cell-text" style="margin-top:6px;">{html_text(shorten(row.get("Descripción", ""), 100))}</div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

                with st.popover("Mover / comentar"):
                    if not can_edit_incident(row, "status"):
                        st.caption("No tienes permiso para mover esta incidencia.")
                        continue

                    new_status = st.selectbox(
                        "Nuevo estatus",
                        statuses,
                        index=statuses.index(status) if status in statuses else 0,
                        key=f"kanban_status_{incident_id}",
                    )
                    comment = st.text_area("Comentario", height=70, key=f"kanban_comment_{incident_id}")
                    formal = {}

                    if new_status in CLOSED_STATUS and status not in CLOSED_STATUS:
                        formal["causa"] = st.selectbox(
                            "Causa raíz",
                            [""] + get_catalog(data, "Causa raíz", []),
                            key=f"kanban_causa_{incident_id}",
                        )
                        formal["accion"] = st.selectbox(
                            "Acción tomada",
                            [""] + get_catalog(data, "Acción tomada", []),
                            key=f"kanban_accion_{incident_id}",
                        )
                        formal["comentario_final"] = st.text_area(
                            "Comentario final",
                            height=70,
                            key=f"kanban_final_{incident_id}",
                        )

                    if status in CLOSED_STATUS and new_status not in CLOSED_STATUS:
                        formal["motivo_reapertura"] = st.text_area(
                            "Motivo de reapertura",
                            height=70,
                            key=f"kanban_reopen_{incident_id}",
                        )

                    if st.button("Guardar cambio", key=f"kanban_save_{incident_id}", use_container_width=True):
                        required_action = "status"
                        if new_status in CLOSED_STATUS and status not in CLOSED_STATUS:
                            required_action = "close"
                        elif status in CLOSED_STATUS and new_status not in CLOSED_STATUS:
                            required_action = "reopen"

                        if not can_edit_incident(row, required_action):
                            st.error("No tienes permiso para realizar esta acción.")
                            continue

                        if new_status == status and not normalize_text(comment):
                            st.warning("No hay cambio de estatus ni comentario.")
                            continue
                        if new_status in CLOSED_STATUS and status not in CLOSED_STATUS:
                            missing = []
                            if not normalize_text(formal.get("causa", "")):
                                missing.append("causa raíz")
                            if not normalize_text(formal.get("accion", "")):
                                missing.append("acción tomada")
                            if not normalize_text(formal.get("comentario_final", "")):
                                missing.append("comentario final")
                            if missing:
                                st.error("Para cerrar debe completar: " + ", ".join(missing) + ".")
                                continue
                        if status in CLOSED_STATUS and new_status not in CLOSED_STATUS and not normalize_text(formal.get("motivo_reapertura", "")):
                            st.error("Para reabrir debe indicar el motivo.")
                            continue

                        _save_status(data, idx, row, new_status, comment.strip(), formal)

            st.markdown("</div>", unsafe_allow_html=True)
    st.markdown("</div>", unsafe_allow_html=True)
