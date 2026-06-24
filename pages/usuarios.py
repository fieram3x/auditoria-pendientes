from datetime import datetime

import pandas as pd
import streamlit as st

from components import page_title
from constants import ADMIN_ROLE, ROLES, SHEET_BITACORA, SHEET_USUARIOS, USUARIOS_COLUMNS
from database import audit_event, clear_cache_and_rerun, persist_changes
from security import hash_password
from ui_utils import badge, normalize_text


def usuarios_page(data):
    page_title("Gestión de usuarios", "Roles, accesos, bloqueos y contraseñas temporales.")

    st.markdown('<div class="user-panel">', unsafe_allow_html=True)
    st.markdown("#### Crear usuario")
    with st.form("crear_usuario", clear_on_submit=True):
        c1, c2, c3, c4, c5 = st.columns([1, 1.2, 1, .95, .95])
        with c1:
            usuario = st.text_input("Usuario")
        with c2:
            nombre = st.text_input("Nombre")
        with c3:
            password = st.text_input("Contraseña temporal", type="password")
        with c4:
            rol = st.selectbox("Rol", ROLES)
        with c5:
            estado = st.selectbox("Estado", ["Activo", "Inactivo"])
        crear = st.form_submit_button("Crear usuario", type="primary")

    if crear:
        if not normalize_text(usuario) or not normalize_text(nombre) or not normalize_text(password):
            st.error("Usuario, nombre y contraseña temporal son obligatorios.")
        elif usuario in data[SHEET_USUARIOS]["Usuario"].astype(str).tolist():
            st.error("Este usuario ya existe.")
        else:
            nuevo = pd.DataFrame(
                [[
                    usuario.strip(),
                    hash_password(password.strip()),
                    nombre.strip(),
                    rol,
                    estado,
                    "",
                    0,
                    "",
                    "Sí",
                ]],
                columns=USUARIOS_COLUMNS,
            )
            data[SHEET_USUARIOS] = pd.concat([data[SHEET_USUARIOS], nuevo], ignore_index=True)
            bit = audit_event(st.session_state.get("user", ""), "Creación de usuario", f"Usuario creado: {usuario}", success=True)
            data[SHEET_BITACORA] = pd.concat([data[SHEET_BITACORA], bit], ignore_index=True)
            persist_changes(data, appended_rows=[(SHEET_USUARIOS, nuevo), (SHEET_BITACORA, bit)])
            st.success("Usuario creado correctamente. Se forzará cambio de contraseña en el primer acceso.")
            clear_cache_and_rerun()
    st.markdown("</div>", unsafe_allow_html=True)

    users = data[SHEET_USUARIOS].copy()
    st.markdown("### Usuarios existentes")
    h = st.columns([1, 1.35, .95, .8, 1, .9, 1.2])
    for col, label in zip(h, ["Usuario", "Nombre", "Rol", "Estado", "Último acceso", "Bloqueo", "Acciones"]):
        with col:
            st.markdown(f"**{label}**")

    for idx, row in users.iterrows():
        username = str(row["Usuario"])
        st.markdown('<div class="table-row">', unsafe_allow_html=True)
        c1, c2, c3, c4, c5, c6, c7 = st.columns([1, 1.35, .95, .8, 1, .9, 1.2])
        with c1:
            st.write(username)
        with c2:
            st.write(row["Nombre"])
        with c3:
            st.markdown(badge(row["Rol"]), unsafe_allow_html=True)
        with c4:
            st.markdown(badge(row["Estado"]), unsafe_allow_html=True)
        with c5:
            st.caption(row.get("Último acceso", ""))
        with c6:
            blocked_until = normalize_text(row.get("Bloqueado hasta", ""))
            attempts = normalize_text(row.get("Intentos fallidos", "0")) or "0"
            st.caption(blocked_until or f"{attempts} intento(s)")
        with c7:
            b1, b2 = st.columns(2)
            with b1:
                if st.button("Editar", key=f"edit_user_{username}"):
                    st.session_state["edit_user"] = username
                    st.rerun()
            with b2:
                disabled = username == "admin"
                if st.button("Inactivar", key=f"inactivate_user_{username}", disabled=disabled):
                    data[SHEET_USUARIOS].loc[idx, "Estado"] = "Inactivo"
                    bit = audit_event(st.session_state.get("user", ""), "Inactivación de usuario", f"Usuario inactivado: {username}", success=True)
                    data[SHEET_BITACORA] = pd.concat([data[SHEET_BITACORA], bit], ignore_index=True)
                    persist_changes(data, row_updates=[(SHEET_USUARIOS, idx)], appended_rows=[(SHEET_BITACORA, bit)])
                    clear_cache_and_rerun()
        st.markdown("</div>", unsafe_allow_html=True)

    edit_user = st.session_state.get("edit_user")
    if not edit_user:
        return

    hit = users[users["Usuario"].astype(str).eq(str(edit_user))]
    if hit.empty:
        st.session_state.pop("edit_user", None)
        st.rerun()

    idx = hit.index[0]
    row = hit.iloc[0]
    st.markdown('<div class="edit-panel">', unsafe_allow_html=True)
    st.markdown(f"#### Editar usuario: `{edit_user}`")
    with st.form(f"form_edit_user_{edit_user}"):
        c1, c2, c3, c4, c5 = st.columns([1.2, 1, .9, .9, .9])
        with c1:
            nuevo_nombre = st.text_input("Nombre", value=str(row["Nombre"]))
        with c2:
            nueva_password = st.text_input("Nueva contraseña temporal", value="", type="password", placeholder="Opcional")
        with c3:
            nuevo_rol = st.selectbox("Rol", ROLES, index=ROLES.index(row["Rol"]) if row["Rol"] in ROLES else 0)
        with c4:
            nuevo_estado = st.selectbox("Estado", ["Activo", "Inactivo"], index=0 if row["Estado"] == "Activo" else 1)
        with c5:
            debe_cambiar = st.selectbox("Forzar cambio", ["No", "Sí"], index=1 if normalize_text(row.get("Debe cambiar password", "")) == "Sí" else 0)

        c6, c7, c8 = st.columns([.28, .28, .44])
        with c6:
            guardar = st.form_submit_button("Guardar", type="primary")
        with c7:
            desbloquear = st.form_submit_button("Desbloquear")
        with c8:
            cancelar = st.form_submit_button("Cancelar")

    if guardar:
        data[SHEET_USUARIOS].loc[idx, "Nombre"] = nuevo_nombre.strip()
        data[SHEET_USUARIOS].loc[idx, "Rol"] = nuevo_rol
        data[SHEET_USUARIOS].loc[idx, "Estado"] = nuevo_estado
        data[SHEET_USUARIOS].loc[idx, "Debe cambiar password"] = debe_cambiar
        if normalize_text(nueva_password):
            data[SHEET_USUARIOS].loc[idx, "Password"] = hash_password(nueva_password)
            data[SHEET_USUARIOS].loc[idx, "Debe cambiar password"] = "Sí"
        bit = audit_event(st.session_state.get("user", ""), "Actualización de usuario", f"Usuario actualizado: {edit_user}", success=True)
        data[SHEET_BITACORA] = pd.concat([data[SHEET_BITACORA], bit], ignore_index=True)
        persist_changes(data, row_updates=[(SHEET_USUARIOS, idx)], appended_rows=[(SHEET_BITACORA, bit)])
        st.session_state.pop("edit_user", None)
        clear_cache_and_rerun()

    if desbloquear:
        data[SHEET_USUARIOS].loc[idx, "Intentos fallidos"] = 0
        data[SHEET_USUARIOS].loc[idx, "Bloqueado hasta"] = ""
        bit = audit_event(st.session_state.get("user", ""), "Desbloqueo de usuario", f"Usuario desbloqueado: {edit_user}", success=True)
        data[SHEET_BITACORA] = pd.concat([data[SHEET_BITACORA], bit], ignore_index=True)
        persist_changes(data, row_updates=[(SHEET_USUARIOS, idx)], appended_rows=[(SHEET_BITACORA, bit)])
        st.session_state.pop("edit_user", None)
        clear_cache_and_rerun()

    if cancelar:
        st.session_state.pop("edit_user", None)
        st.rerun()
    st.markdown("</div>", unsafe_allow_html=True)
