import streamlit as st

from constants import APP_TITLE

st.set_page_config(
    page_title=APP_TITLE,
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)

from auth import can_access_page, change_password_view, login_view
from components import header, render_global_styles, sidebar_nav
from database import cached_load
from pages.bitacora import bitacora_page
from pages.catalogos import catalogos_page
from pages.dashboard import dashboard_page
from pages.kanban import kanban_page
from pages.pendientes import pendientes_page
from pages.usuarios import usuarios_page


def main():
    render_global_styles()

    try:
        data = cached_load()
    except Exception as exc:
        st.error("No se pudo conectar o cargar la base de datos de Google Sheets.")
        st.exception(exc)
        return

    if not st.session_state.get("logged"):
        login_view(data)
        return

    if st.session_state.get("must_change_password"):
        change_password_view(data)
        return

    page = sidebar_nav()
    header()

    if not can_access_page(page):
        st.warning("No tienes acceso a este módulo.")
        return

    if page == "Dashboard":
        dashboard_page(data)
    elif page == "Pendientes":
        pendientes_page(data)
    elif page == "Kanban":
        kanban_page(data)
    elif page == "Bitácora":
        bitacora_page(data)
    elif page == "Usuarios":
        usuarios_page(data)
    elif page == "Catálogos":
        catalogos_page(data)
    else:
        st.warning("Página no disponible.")


if __name__ == "__main__":
    main()
