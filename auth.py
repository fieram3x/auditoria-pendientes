from datetime import datetime, timedelta

import pandas as pd
import streamlit as st

from constants import (
    ADMIN_ROLE,
    AUDITOR_ROLE,
    LOCK_MINUTES,
    MAX_FAILED_ATTEMPTS,
    ROLES,
    SHEET_BITACORA,
    SHEET_USUARIOS,
    SUPERVISOR_ROLE,
)
from database import audit_event, clear_cache_and_rerun, persist_changes, user_index
from security import hash_password, is_password_hash, verify_password
from ui_utils import html_text, normalize_text


def truthy(value):
    return normalize_text(value).lower() in {"si", "sí", "true", "1", "yes", "y"}


def current_user():
    return {
        "user": st.session_state.get("user", ""),
        "name": st.session_state.get("name", ""),
        "role": st.session_state.get("role", ""),
    }


def has_permission(action):
    role = st.session_state.get("role", "")
    if role == ADMIN_ROLE:
        return True

    supervisor_permissions = {
        "dashboard",
        "pendientes",
        "kanban",
        "bitacora",
        "export",
        "edit",
        "comment",
        "close",
        "reopen",
        "create",
    }
    auditor_permissions = {
        "dashboard",
        "pendientes",
        "kanban",
        "bitacora",
        "export",
        "create",
        "comment",
        "edit_assigned",
    }

    if role == SUPERVISOR_ROLE:
        return action in supervisor_permissions
    if role == AUDITOR_ROLE:
        return action in auditor_permissions
    return False


def can_access_page(page):
    page_actions = {
        "Dashboard": "dashboard",
        "Pendientes": "pendientes",
        "Kanban": "kanban",
        "Bitácora": "bitacora",
        "Usuarios": "users",
        "Catálogos": "catalogs",
    }
    return has_permission(page_actions.get(page, ""))


def can_edit_incident(row, action="edit"):
    role = st.session_state.get("role", "")
    if role == ADMIN_ROLE:
        return True
    if role == SUPERVISOR_ROLE:
        return action in {"edit", "comment", "close", "reopen", "status"}
    if role != AUDITOR_ROLE:
        return False
    if action in {"create", "comment"}:
        return True
    if action not in {"edit", "status"}:
        return False

    user = normalize_text(st.session_state.get("user", "")).lower()
    name = normalize_text(st.session_state.get("name", "")).lower()
    assigned_values = {
        normalize_text(row.get("Responsable", "")).lower(),
        normalize_text(row.get("Usuario asignado", "")).lower(),
        normalize_text(row.get("Creado por", "")).lower(),
    }
    return bool({user, name} & assigned_values)


def _parse_block_until(value):
    if not normalize_text(value):
        return pd.NaT
    return pd.to_datetime(value, errors="coerce")


def _blocked_message(blocked_until):
    return f"Usuario bloqueado temporalmente hasta {blocked_until.strftime('%d/%m/%Y %I:%M %p')}."


def login_view(data):
    st.markdown(
        f"""
        <div class="app-shell" style="max-width:520px;margin:6vh auto 1rem;">
            <div class="brand">
                <div class="logo">🛡️</div>
                <div class="title">
                    <h1>{html_text("Auditoría Pendientes")}</h1>
                    <p>Acceso seguro al sistema de incidencias</p>
                </div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    c1, c2, c3 = st.columns([1.1, 1, 1.1])
    with c2:
        if st.session_state.get("initial_admin_password"):
            st.warning(
                "Base inicial creada. Usuario: admin. La contraseña temporal se muestra solo en esta inicialización: "
                + st.session_state["initial_admin_password"]
            )

        with st.form("login_form"):
            usuario = st.text_input("Usuario", placeholder="Ingrese su usuario")
            password = st.text_input("Contraseña", type="password", placeholder="Ingrese su contraseña")
            entrar = st.form_submit_button("Entrar", type="primary", use_container_width=True)

        if not entrar:
            return

        users = data[SHEET_USUARIOS]
        hit = users[
            (users["Usuario"].astype(str).str.strip() == normalize_text(usuario))
            & (users["Estado"].astype(str).str.strip() == "Activo")
        ]

        if hit.empty:
            bit = audit_event(normalize_text(usuario), "Login fallido", "Usuario inexistente o inactivo.", success=False)
            data[SHEET_BITACORA] = pd.concat([data[SHEET_BITACORA], bit], ignore_index=True)
            persist_changes(data, appended_rows=[(SHEET_BITACORA, bit)])
            st.error("Usuario o contraseña incorrectos, o usuario inactivo.")
            return

        idx = hit.index[0]
        row = hit.iloc[0]
        blocked_until = _parse_block_until(row.get("Bloqueado hasta", ""))

        if not pd.isna(blocked_until) and blocked_until > pd.Timestamp.now():
            bit = audit_event(usuario, "Login bloqueado", "Intento con usuario bloqueado.", success=False)
            data[SHEET_BITACORA] = pd.concat([data[SHEET_BITACORA], bit], ignore_index=True)
            persist_changes(data, appended_rows=[(SHEET_BITACORA, bit)])
            st.error(_blocked_message(blocked_until))
            return

        if not verify_password(password, row.get("Password", "")):
            attempts_value = pd.to_numeric(row.get("Intentos fallidos", 0), errors="coerce")
            attempts = (0 if pd.isna(attempts_value) else int(attempts_value)) + 1
            data[SHEET_USUARIOS].loc[idx, "Intentos fallidos"] = attempts
            comment = f"Contraseña incorrecta. Intento {attempts}/{MAX_FAILED_ATTEMPTS}."
            if attempts >= MAX_FAILED_ATTEMPTS:
                blocked = datetime.now() + timedelta(minutes=LOCK_MINUTES)
                data[SHEET_USUARIOS].loc[idx, "Bloqueado hasta"] = blocked.strftime("%Y-%m-%d %H:%M:%S")
                comment += f" Usuario bloqueado {LOCK_MINUTES} minutos."
            bit = audit_event(usuario, "Login fallido", comment, success=False)
            data[SHEET_BITACORA] = pd.concat([data[SHEET_BITACORA], bit], ignore_index=True)
            persist_changes(data, row_updates=[(SHEET_USUARIOS, idx)], appended_rows=[(SHEET_BITACORA, bit)])
            st.error("Usuario o contraseña incorrectos, o usuario inactivo.")
            return

        data[SHEET_USUARIOS].loc[idx, "Intentos fallidos"] = 0
        data[SHEET_USUARIOS].loc[idx, "Bloqueado hasta"] = ""
        data[SHEET_USUARIOS].loc[idx, "Último acceso"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        if not is_password_hash(row.get("Password", "")):
            data[SHEET_USUARIOS].loc[idx, "Password"] = hash_password(password)
            data[SHEET_USUARIOS].loc[idx, "Debe cambiar password"] = "Sí"

        bit = audit_event(usuario, "Login exitoso", "Acceso concedido.", success=True)
        data[SHEET_BITACORA] = pd.concat([data[SHEET_BITACORA], bit], ignore_index=True)
        persist_changes(data, row_updates=[(SHEET_USUARIOS, idx)], appended_rows=[(SHEET_BITACORA, bit)])

        st.session_state["logged"] = True
        st.session_state["user"] = str(row["Usuario"])
        st.session_state["name"] = str(row["Nombre"])
        st.session_state["role"] = str(row["Rol"]) if row["Rol"] in ROLES else AUDITOR_ROLE
        st.session_state["must_change_password"] = truthy(data[SHEET_USUARIOS].loc[idx, "Debe cambiar password"])
        st.session_state.pop("initial_admin_password", None)
        st.rerun()


def change_password_view(data):
    st.markdown(
        """
        <div class="app-shell" style="max-width:560px;margin:6vh auto 1rem;">
            <div class="title">
                <h1>Cambio de contraseña requerido</h1>
                <p>Actualiza tu contraseña temporal para continuar.</p>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    idx = user_index(data, st.session_state.get("user", ""))
    if idx is None:
        st.error("No se encontró el usuario activo.")
        return

    c1, c2, c3 = st.columns([1.1, 1, 1.1])
    with c2:
        with st.form("change_password_form"):
            password = st.text_input("Nueva contraseña", type="password")
            confirm = st.text_input("Confirmar contraseña", type="password")
            submit = st.form_submit_button("Guardar contraseña", type="primary", use_container_width=True)

        if submit:
            if len(password) < 8:
                st.error("La contraseña debe tener al menos 8 caracteres.")
                return
            if password != confirm:
                st.error("Las contraseñas no coinciden.")
                return

            data[SHEET_USUARIOS].loc[idx, "Password"] = hash_password(password)
            data[SHEET_USUARIOS].loc[idx, "Debe cambiar password"] = "No"
            bit = audit_event(st.session_state.get("user", ""), "Cambio de contraseña", "Contraseña temporal actualizada.", success=True)
            data[SHEET_BITACORA] = pd.concat([data[SHEET_BITACORA], bit], ignore_index=True)
            persist_changes(data, row_updates=[(SHEET_USUARIOS, idx)], appended_rows=[(SHEET_BITACORA, bit)])
            st.session_state["must_change_password"] = False
            st.success("Contraseña actualizada correctamente.")
            clear_cache_and_rerun()
