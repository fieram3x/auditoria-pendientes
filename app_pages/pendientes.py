from datetime import datetime

import pandas as pd
import streamlit as st

from auth import can_edit_incident, has_permission
from components import alert_center, format_filter_summary, incident_filters, page_title, render_timeline
from constants import CLOSED_STATUS, KANBAN_STATUSES, PENDIENTES_COLUMNS, PRIORITIES, SHEET_BITACORA, SHEET_PENDIENTES
from database import (
    apply_incident_update,
    bitacora_rows,
    clear_cache_and_rerun,
    get_catalog,
    next_id,
    persist_changes,
    responsible_options,
)
from exports import filtered_excel_bytes
from sla import add_sla_columns, parse_any_date, suggested_due_date, sla_info
from ui_utils import badge, html_text, normalize_text, safe_date, shorten


DIALOG_KEYS = ["show_create", "edit_id", "detail_id", "comment_id", "close_id", "reopen_id"]


def _clear_dialogs(keep=None):
    for key in DIALOG_KEYS:
        if key != keep:
            st.session_state.pop(key, None)


def _find_incident_idx(data, incident_id):
    df = data[SHEET_PENDIENTES]
    hit = df[df["ID"].astype(str).eq(str(incident_id))]
    return None if hit.empty else hit.index[0]


def _options(data, category, fallback=None, blank=False, current=None):
    values = get_catalog(data, category, fallback or [])
    if current and current not in values:
        values = [current] + values
    values = list(dict.fromkeys([v for v in values if normalize_text(v)]))
    return [""] + values if blank else values


def _responsables(data, current=None, blank=False):
    values = responsible_options(data)
    if current and current not in values:
        values = [current] + values
    values = list(dict.fromkeys([v for v in values if normalize_text(v)]))
    return [""] + values if blank else values


def _selected_index(options, current):
    current = normalize_text(current)
    normalized = [normalize_text(option) for option in options]
    return normalized.index(current) if current in normalized else 0


def _date_value(value, fallback):
    parsed = parse_any_date(value)
    return parsed.date() if not pd.isna(parsed) else fallback


def _status_updates(old_status, new_status, current_row, extra_updates):
    updates = dict(extra_updates)
    today = datetime.now().strftime("%Y-%m-%d")
    if new_status in CLOSED_STATUS and old_status not in CLOSED_STATUS:
        updates["Fecha Cierre"] = today
    elif old_status in CLOSED_STATUS and new_status not in CLOSED_STATUS:
        updates["Fecha Cierre"] = ""
    elif new_status in CLOSED_STATUS and not normalize_text(current_row.get("Fecha Cierre", "")):
        updates["Fecha Cierre"] = today
    return updates


def _save_incident(data, idx, updates, action, comment):
    apply_incident_update(data, idx, updates, action, comment)
    clear_cache_and_rerun()


@st.dialog("➕ Nueva incidencia", width="large")
def render_create_incidence_dialog(data):
    created_by = st.session_state.get("user", "")
    c1, c2, c3 = st.columns(3)

    with c1:
        hotel = st.selectbox("Hotel", _options(data, "Hotel", blank=True), key="new_hotel")
        departamento = st.selectbox("Departamento", _options(data, "Departamento", blank=True), key="new_departamento")
        area = st.selectbox("Área responsable", _options(data, "Área Responsable", blank=True), key="new_area")

    with c2:
        tipo = st.selectbox("Tipo de incidencia", _options(data, "Tipo de Incidencia", blank=True), key="new_tipo")
        impacto = st.selectbox("Impacto", _options(data, "Impacto", blank=True), key="new_impacto")
        prioridad = st.selectbox("Prioridad", [""] + PRIORITIES, key="new_prioridad")

    with c3:
        responsable = st.selectbox("Responsable", _responsables(data, blank=True), key="new_responsable")
        initial_statuses = [status for status in KANBAN_STATUSES if status not in CLOSED_STATUS]
        estatus = st.selectbox("Estatus inicial", initial_statuses, index=0, key="new_estatus")
        fecha_default = suggested_due_date(prioridad or "Media", datetime.now().strftime("%Y-%m-%d"))
        fecha_compromiso = st.date_input("Fecha compromiso", value=fecha_default, key="new_fecha_compromiso")

    descripcion = st.text_area("Descripción", height=110, placeholder="Describe la incidencia con contexto operativo.", key="new_descripcion")
    evidencia = st.text_input("Evidencia URL", placeholder="https://...", key="new_evidencia")

    b1, b2 = st.columns([.25, .75])
    with b1:
        submitted = st.button("Guardar", type="primary", use_container_width=True, key="new_save")
    with b2:
        cancel = st.button("Cancelar", key="new_cancel")

    if submitted:
        required = {
            "Hotel": hotel,
            "Departamento": departamento,
            "Tipo de incidencia": tipo,
            "Impacto": impacto,
            "Prioridad": prioridad,
            "Descripción": descripcion,
        }
        missing = [label for label, value in required.items() if not normalize_text(value)]
        if missing:
            st.error("Debe completar: " + ", ".join(missing) + ".")
            return

        pid = next_id()
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        assigned_date = datetime.now().strftime("%Y-%m-%d") if normalize_text(responsable) else ""
        row_values = {
            "ID": pid,
            "Fecha Creación": datetime.now().strftime("%Y-%m-%d"),
            "Hotel": hotel,
            "Departamento": departamento,
            "Área Responsable": area or departamento,
            "Tipo de Incidencia": tipo,
            "Impacto": impacto,
            "Prioridad": prioridad,
            "Estatus": estatus,
            "Responsable": responsable,
            "Usuario asignado": responsable,
            "Creado por": created_by,
            "Última actualización por": created_by,
            "Fecha asignación": assigned_date,
            "Fecha Compromiso": fecha_compromiso.strftime("%Y-%m-%d"),
            "Fecha Vencimiento Real": fecha_compromiso.strftime("%Y-%m-%d"),
            "Descripción": descripcion.strip(),
            "Causa raíz": "",
            "Acción tomada": "",
            "Motivo de cierre": "",
            "Evidencia URL": evidencia.strip(),
            "Comentario final": "",
            "Fecha Cierre": datetime.now().strftime("%Y-%m-%d") if estatus in CLOSED_STATUS else "",
            "Última Actualización": now,
        }
        new_row = pd.DataFrame([[row_values.get(col, "") for col in PENDIENTES_COLUMNS]], columns=PENDIENTES_COLUMNS)
        data[SHEET_PENDIENTES] = pd.concat([data[SHEET_PENDIENTES], new_row], ignore_index=True)
        bit = bitacora_rows(
            pid,
            "Creación",
            "Incidencia creada.",
            [{"field": "Incidencia", "old": "", "new": "Creada"}],
            row=new_row.iloc[0],
            user=created_by,
        )
        data[SHEET_BITACORA] = pd.concat([data[SHEET_BITACORA], bit], ignore_index=True)
        persist_changes(data, appended_rows=[(SHEET_PENDIENTES, new_row), (SHEET_BITACORA, bit)])
        for key in list(st.session_state.keys()):
            if key.startswith("new_") or key == "show_create":
                st.session_state.pop(key, None)
        st.success("Incidencia creada correctamente.")
        clear_cache_and_rerun()

    if cancel:
        for key in list(st.session_state.keys()):
            if key.startswith("new_") or key == "show_create":
                st.session_state.pop(key, None)
        st.rerun()


@st.dialog("✏️ Editar incidencia", width="large")
def render_edit_incidence_dialog(data):
    incident_id = st.session_state.get("edit_id")
    idx = _find_incident_idx(data, incident_id)
    if idx is None:
        st.session_state.pop("edit_id", None)
        st.rerun()
    row = data[SHEET_PENDIENTES].loc[idx]

    if not can_edit_incident(row, "edit"):
        st.error("No tienes permiso para editar esta incidencia.")
        return

    st.markdown(f"**Incidencia:** `{html_text(incident_id)}`")
    old_status = normalize_text(row.get("Estatus", ""))

    with st.form(f"edit_form_{incident_id}"):
        c1, c2, c3 = st.columns(3)
        with c1:
            status_options = _options(data, "Estatus", KANBAN_STATUSES, current=old_status)
            status = st.selectbox("Estatus", status_options, index=status_options.index(old_status) if old_status in status_options else 0)
            prioridad_options = _options(data, "Prioridad", PRIORITIES, current=row.get("Prioridad", ""))
            prioridad = st.selectbox("Prioridad", prioridad_options, index=_selected_index(prioridad_options, row.get("Prioridad", "")))
            responsable_options = _responsables(data, current=row.get("Responsable", ""), blank=True)
            responsable = st.selectbox(
                "Responsable",
                responsable_options,
                index=_selected_index(responsable_options, row.get("Responsable", "")),
            )
        with c2:
            fecha = st.date_input(
                "Fecha compromiso",
                value=_date_value(row.get("Fecha Compromiso", ""), suggested_due_date(row.get("Prioridad", "Media"), row.get("Fecha Creación", ""))),
            )
            causa_options = _options(data, "Causa raíz", blank=True, current=row.get("Causa raíz", ""))
            causa = st.selectbox("Causa raíz", causa_options, index=_selected_index(causa_options, row.get("Causa raíz", "")))
            accion_options = _options(data, "Acción tomada", blank=True, current=row.get("Acción tomada", ""))
            accion = st.selectbox("Acción tomada", accion_options, index=_selected_index(accion_options, row.get("Acción tomada", "")))
        with c3:
            motivo_cierre = st.text_input("Motivo de cierre", value=str(row.get("Motivo de cierre", "")))
            evidencia = st.text_input("Evidencia URL", value=str(row.get("Evidencia URL", "")))
            comentario_final = st.text_area("Comentario final", value=str(row.get("Comentario final", "")), height=80)

        descripcion = st.text_area("Descripción", value=str(row.get("Descripción", "")), height=110)
        comentario = st.text_area("Comentario de actualización", height=80, placeholder="Explica el cambio realizado.")

        if old_status in CLOSED_STATUS and status not in CLOSED_STATUS:
            motivo_reapertura = st.text_area("Motivo de reapertura", height=70)
        else:
            motivo_reapertura = ""

        submitted = st.form_submit_button("Guardar cambios", type="primary")
        cancel = st.form_submit_button("Cancelar")

    if submitted:
        if status in CLOSED_STATUS and old_status not in CLOSED_STATUS:
            missing = []
            if not normalize_text(causa):
                missing.append("causa raíz")
            if not normalize_text(accion):
                missing.append("acción tomada")
            if not normalize_text(comentario_final):
                missing.append("comentario final")
            if missing:
                st.error("Para cerrar la incidencia debe completar: " + ", ".join(missing) + ".")
                return

        if old_status in CLOSED_STATUS and status not in CLOSED_STATUS and not normalize_text(motivo_reapertura):
            st.error("Para reabrir una incidencia cerrada debe indicar el motivo.")
            return

        updates = {
            "Estatus": status,
            "Prioridad": prioridad,
            "Responsable": responsable,
            "Usuario asignado": responsable,
            "Fecha Compromiso": fecha.strftime("%Y-%m-%d"),
            "Fecha Vencimiento Real": fecha.strftime("%Y-%m-%d"),
            "Descripción": descripcion.strip(),
            "Causa raíz": causa,
            "Acción tomada": accion,
            "Motivo de cierre": motivo_cierre.strip(),
            "Evidencia URL": evidencia.strip(),
            "Comentario final": comentario_final.strip(),
        }
        if normalize_text(responsable) and normalize_text(responsable) != normalize_text(row.get("Responsable", "")):
            updates["Fecha asignación"] = datetime.now().strftime("%Y-%m-%d")

        updates = _status_updates(old_status, status, row, updates)
        action = "Actualización de incidencia"
        if status in CLOSED_STATUS and old_status not in CLOSED_STATUS:
            action = "Cierre formal"
        elif old_status in CLOSED_STATUS and status not in CLOSED_STATUS:
            action = "Reapertura"
            comentario = f"{comentario.strip()}\nMotivo de reapertura: {motivo_reapertura.strip()}".strip()

        st.session_state.pop("edit_id", None)
        _save_incident(data, idx, updates, action, comentario.strip() or "Actualización registrada.")

    if cancel:
        st.session_state.pop("edit_id", None)
        st.rerun()


@st.dialog("💬 Comentar incidencia", width="large")
def render_comment_dialog(data):
    incident_id = st.session_state.get("comment_id")
    idx = _find_incident_idx(data, incident_id)
    if idx is None:
        st.session_state.pop("comment_id", None)
        st.rerun()
    row = data[SHEET_PENDIENTES].loc[idx]
    if not can_edit_incident(row, "comment"):
        st.error("No tienes permiso para comentar esta incidencia.")
        return

    st.markdown(f"**Incidencia:** `{html_text(incident_id)}`")
    comment = st.text_area("Comentario", height=130, placeholder="Agrega un comentario de seguimiento.")
    c1, c2 = st.columns([.25, .75])
    with c1:
        save = st.button("Guardar", type="primary", use_container_width=True, key=f"comment_save_{incident_id}")
    with c2:
        cancel = st.button("Cancelar", key=f"comment_cancel_{incident_id}")

    if save:
        if not normalize_text(comment):
            st.error("El comentario es obligatorio.")
            return
        st.session_state.pop("comment_id", None)
        _save_incident(data, idx, {}, "Comentario", comment.strip())

    if cancel:
        st.session_state.pop("comment_id", None)
        st.rerun()


@st.dialog("✅ Cierre formal", width="large")
def render_close_dialog(data):
    incident_id = st.session_state.get("close_id")
    idx = _find_incident_idx(data, incident_id)
    if idx is None:
        st.session_state.pop("close_id", None)
        st.rerun()
    row = data[SHEET_PENDIENTES].loc[idx]
    if not can_edit_incident(row, "close"):
        st.error("No tienes permiso para cerrar esta incidencia.")
        return

    st.markdown(f"**Incidencia:** `{html_text(incident_id)}`")
    causa_options = _options(data, "Causa raíz", blank=True, current=row.get("Causa raíz", ""))
    causa = st.selectbox("Causa raíz", causa_options, index=_selected_index(causa_options, row.get("Causa raíz", "")))
    accion_options = _options(data, "Acción tomada", blank=True, current=row.get("Acción tomada", ""))
    accion = st.selectbox("Acción tomada", accion_options, index=_selected_index(accion_options, row.get("Acción tomada", "")))
    motivo = st.text_input("Motivo de cierre", value=str(row.get("Motivo de cierre", "")))
    evidencia = st.text_input("Evidencia URL", value=str(row.get("Evidencia URL", "")))
    comentario_final = st.text_area("Comentario final", height=110, value=str(row.get("Comentario final", "")))
    c1, c2 = st.columns([.25, .75])
    with c1:
        save = st.button("Cerrar incidencia", type="primary", use_container_width=True, key=f"close_save_{incident_id}")
    with c2:
        cancel = st.button("Cancelar", key=f"close_cancel_{incident_id}")

    if save:
        missing = []
        if not normalize_text(causa):
            missing.append("causa raíz")
        if not normalize_text(accion):
            missing.append("acción tomada")
        if not normalize_text(comentario_final):
            missing.append("comentario final")
        if missing:
            st.error("Debe completar: " + ", ".join(missing) + ".")
            return
        updates = {
            "Estatus": "Cerrado",
            "Causa raíz": causa,
            "Acción tomada": accion,
            "Motivo de cierre": motivo.strip(),
            "Evidencia URL": evidencia.strip(),
            "Comentario final": comentario_final.strip(),
            "Fecha Cierre": datetime.now().strftime("%Y-%m-%d"),
        }
        st.session_state.pop("close_id", None)
        _save_incident(data, idx, updates, "Cierre formal", comentario_final.strip())

    if cancel:
        st.session_state.pop("close_id", None)
        st.rerun()


@st.dialog("🔁 Reabrir incidencia", width="large")
def render_reopen_dialog(data):
    incident_id = st.session_state.get("reopen_id")
    idx = _find_incident_idx(data, incident_id)
    if idx is None:
        st.session_state.pop("reopen_id", None)
        st.rerun()
    row = data[SHEET_PENDIENTES].loc[idx]
    if not can_edit_incident(row, "reopen"):
        st.error("No tienes permiso para reabrir esta incidencia.")
        return

    st.markdown(f"**Incidencia:** `{html_text(incident_id)}`")
    status_options = [status for status in KANBAN_STATUSES if status not in CLOSED_STATUS]
    new_status = st.selectbox("Nuevo estatus", status_options, index=status_options.index("En proceso") if "En proceso" in status_options else 0)
    motivo = st.text_area("Motivo de reapertura", height=120)
    c1, c2 = st.columns([.25, .75])
    with c1:
        save = st.button("Reabrir", type="primary", use_container_width=True, key=f"reopen_save_{incident_id}")
    with c2:
        cancel = st.button("Cancelar", key=f"reopen_cancel_{incident_id}")

    if save:
        if not normalize_text(motivo):
            st.error("El motivo de reapertura es obligatorio.")
            return
        updates = {"Estatus": new_status, "Fecha Cierre": ""}
        st.session_state.pop("reopen_id", None)
        _save_incident(data, idx, updates, "Reapertura", f"Motivo de reapertura: {motivo.strip()}")

    if cancel:
        st.session_state.pop("reopen_id", None)
        st.rerun()


@st.dialog("🧾 Detalle de incidencia", width="large")
def render_detail_dialog(data):
    incident_id = st.session_state.get("detail_id")
    idx = _find_incident_idx(data, incident_id)
    if idx is None:
        st.session_state.pop("detail_id", None)
        st.rerun()
    row = add_sla_columns(data[SHEET_PENDIENTES].loc[[idx]]).iloc[0]
    bit = data[SHEET_BITACORA]
    bit = bit[bit["ID Pendiente"].astype(str).eq(str(incident_id))]

    st.markdown(f"### {html_text(row.get('ID', ''))}")
    c1, c2, c3 = st.columns(3)
    with c1:
        st.markdown(f"**Hotel:** {html_text(row.get('Hotel', ''))}")
        st.markdown(f"**Departamento:** {html_text(row.get('Departamento', ''))}")
        st.markdown(f"**Responsable:** {html_text(row.get('Responsable', '') or 'Sin asignar')}")
    with c2:
        st.markdown(f"**Prioridad:** {badge(row.get('Prioridad', ''))}", unsafe_allow_html=True)
        st.markdown(f"**Estatus:** {badge(row.get('Estatus', ''))}", unsafe_allow_html=True)
        st.markdown(f"**SLA:** {badge(row.get('SLA', ''))}", unsafe_allow_html=True)
    with c3:
        st.markdown(f"**Creado por:** {html_text(row.get('Creado por', ''))}")
        st.markdown(f"**Fecha compromiso:** {html_text(safe_date(row.get('Fecha Compromiso', '')))}")
        st.markdown(f"**Fecha cierre:** {html_text(safe_date(row.get('Fecha Cierre', '')))}")

    st.markdown("#### Descripción")
    st.write(row.get("Descripción", ""))
    st.markdown("#### Cierre / evidencia")
    st.write({
        "Causa raíz": row.get("Causa raíz", ""),
        "Acción tomada": row.get("Acción tomada", ""),
        "Motivo de cierre": row.get("Motivo de cierre", ""),
        "Evidencia URL": row.get("Evidencia URL", ""),
        "Comentario final": row.get("Comentario final", ""),
    })
    st.markdown("#### Línea de tiempo")
    render_timeline(bit)

    if st.button("Cerrar detalle", key=f"detail_close_{incident_id}"):
        st.session_state.pop("detail_id", None)
        st.rerun()


def _action_button(label, state_key, incident_id, disabled=False):
    if st.button(label, key=f"{state_key}_{incident_id}", use_container_width=True, disabled=disabled):
        _clear_dialogs(state_key)
        st.session_state[state_key] = incident_id
        st.rerun()


def render_incident_table(data, dff):
    dff = add_sla_columns(dff)
    st.markdown('<div class="compact-table">', unsafe_allow_html=True)
    head = st.columns([1.05, .8, 1.05, 1.1, .85, .95, 1.05, .95, 1.7, .55])
    for col, title in zip(head, ["ID", "Fecha", "Hotel", "Departamento", "Prioridad", "Estatus", "Responsable", "SLA", "Descripción", "Acción"]):
        with col:
            st.markdown(f'<div class="table-head">{title}</div>', unsafe_allow_html=True)

    if dff.empty:
        st.info("No hay incidencias con los filtros seleccionados.")
        st.markdown("</div>", unsafe_allow_html=True)
        return

    controls = st.columns([.7, .8, 3.5])
    with controls[0]:
        page_size = st.selectbox("Filas", [15, 25, 50, 100], index=1, key="pending_page_size")
    total_rows = len(dff)
    total_pages = max(1, (total_rows + page_size - 1) // page_size)
    current_page = min(st.session_state.get("pending_page", 1), total_pages)
    with controls[1]:
        current_page = st.number_input("Página", min_value=1, max_value=total_pages, value=current_page, step=1, key="pending_page")
    with controls[2]:
        st.caption(f"Mostrando {(current_page - 1) * page_size + 1}-{min(current_page * page_size, total_rows)} de {total_rows}.")

    dff_page = dff.iloc[(current_page - 1) * page_size: current_page * page_size]
    for _, row in dff_page.iterrows():
        info = sla_info(row)
        css = "row-overdue" if info["class"] == "overdue" else "row-warning" if info["class"] == "warning" else ""
        st.markdown(f'<div class="table-row {css}">', unsafe_allow_html=True)
        cols = st.columns([1.05, .8, 1.05, 1.1, .85, .95, 1.05, .95, 1.7, .55])
        incident_id = str(row.get("ID", ""))
        with cols[0]:
            st.markdown(f'<div class="cell-main">{html_text(incident_id)}</div>', unsafe_allow_html=True)
        with cols[1]:
            st.markdown(f'<div class="cell-muted">{html_text(safe_date(row.get("Fecha Creación", "")))}</div>', unsafe_allow_html=True)
        with cols[2]:
            st.markdown(f'<div class="cell-text">{html_text(row.get("Hotel", ""))}</div>', unsafe_allow_html=True)
        with cols[3]:
            st.markdown(f'<div class="cell-text">{html_text(row.get("Departamento", ""))}</div>', unsafe_allow_html=True)
        with cols[4]:
            st.markdown(badge(row.get("Prioridad", "")), unsafe_allow_html=True)
        with cols[5]:
            st.markdown(badge(row.get("Estatus", "")), unsafe_allow_html=True)
        with cols[6]:
            st.markdown(f'<div class="cell-text">{html_text(row.get("Responsable", "") or "Sin asignar")}</div>', unsafe_allow_html=True)
        with cols[7]:
            st.markdown(badge(row.get("SLA", "")), unsafe_allow_html=True)
        with cols[8]:
            st.markdown(f'<div class="cell-text">{html_text(shorten(row.get("Descripción", ""), 110))}</div>', unsafe_allow_html=True)
        with cols[9]:
            with st.popover("⋮"):
                st.markdown("**Acciones**")
                _action_button("Detalle", "detail_id", incident_id)
                _action_button("Comentar", "comment_id", incident_id, disabled=not can_edit_incident(row, "comment"))
                _action_button("Editar", "edit_id", incident_id, disabled=not can_edit_incident(row, "edit"))
                if normalize_text(row.get("Estatus", "")) in CLOSED_STATUS:
                    _action_button("Reabrir", "reopen_id", incident_id, disabled=not can_edit_incident(row, "reopen"))
                else:
                    _action_button("Cerrar", "close_id", incident_id, disabled=not can_edit_incident(row, "close"))
        st.markdown("</div>", unsafe_allow_html=True)

    st.markdown("</div>", unsafe_allow_html=True)

    if st.session_state.get("show_create"):
        _clear_dialogs("show_create")
        render_create_incidence_dialog(data)
    elif st.session_state.get("edit_id"):
        _clear_dialogs("edit_id")
        render_edit_incidence_dialog(data)
    elif st.session_state.get("detail_id"):
        _clear_dialogs("detail_id")
        render_detail_dialog(data)
    elif st.session_state.get("comment_id"):
        _clear_dialogs("comment_id")
        render_comment_dialog(data)
    elif st.session_state.get("close_id"):
        _clear_dialogs("close_id")
        render_close_dialog(data)
    elif st.session_state.get("reopen_id"):
        _clear_dialogs("reopen_id")
        render_reopen_dialog(data)


def pendientes_page(data):
    can_create = has_permission("create")
    create_clicked = page_title(
        "Pendientes / Incidencias",
        "Gestión operativa con responsables, SLA, comentarios, cierre formal y reapertura.",
        "+ Nueva incidencia",
        "btn_new_incidence",
        button_disabled=not can_create,
    )
    if create_clicked:
        _clear_dialogs("show_create")
        st.session_state["show_create"] = True
        st.rerun()

    df = data[SHEET_PENDIENTES].copy()
    alert_center(df)
    dff, filters = incident_filters(df, data=data, prefix="pend")

    export_cols = st.columns([.9, 4])
    with export_cols[0]:
        st.download_button(
            "Excel filtrado",
            filtered_excel_bytes(add_sla_columns(dff), format_filter_summary(filters), "Pendientes filtrados"),
            "pendientes_filtrados.xlsx",
            use_container_width=True,
            disabled=not has_permission("export"),
        )

    render_incident_table(data, dff)
