# ==========================================================
# PENDIENTES
# ==========================================================
@st.dialog("➕ Nueva incidencia", width="large")
def render_create_incidence_dialog(data):
    """Formulario de nueva incidencia en ventana flotante.
    Siempre inicia completamente en blanco.
    """

    with st.form("crear_inc_modal", clear_on_submit=True):

        c1, c2, c3 = st.columns(3)

        # ==========================================
        # COLUMNA 1
        # ==========================================
        with c1:

            hotel = st.selectbox(
                "Hotel",
                get_catalog(data, "Hotel"),
                index=None,
                placeholder="Seleccione...",
                key="new_hotel_modal"
            )

            depto = st.selectbox(
                "Departamento",
                get_catalog(data, "Departamento"),
                index=None,
                placeholder="Seleccione...",
                key="new_depto_modal"
            )

            prioridad = st.selectbox(
                "Prioridad",
                get_catalog(data, "Prioridad"),
                index=None,
                placeholder="Seleccione...",
                key="new_prioridad_modal"
            )

        # ==========================================
        # COLUMNA 2
        # ==========================================
        with c2:

            tipo = st.selectbox(
                "Tipo de Incidencia",
                get_catalog(data, "Tipo de Incidencia"),
                index=None,
                placeholder="Seleccione...",
                key="new_tipo_modal"
            )

            impacto = st.selectbox(
                "Impacto",
                get_catalog(data, "Impacto"),
                index=None,
                placeholder="Seleccione...",
                key="new_impacto_modal"
            )

            estatus = st.selectbox(
                "Estatus inicial",
                get_catalog(data, "Estatus"),
                index=None,
                placeholder="Seleccione...",
                key="new_estatus_modal"
            )

        # ==========================================
        # COLUMNA 3
        # ==========================================
        with c3:

            fecha_comp = st.date_input(
                "Fecha compromiso",
                value=None,
                key="new_fecha_modal"
            )

            descripcion = st.text_area(
                "Descripción",
                value="",
                height=100,
                placeholder="Detalle la incidencia...",
                key="new_descripcion_modal"
            )

        # ==========================================
        # BOTONES
        # ==========================================
        b1, b2 = st.columns([0.28, 0.72])

        with b1:
            submitted = st.form_submit_button(
                "Guardar",
                type="primary",
                use_container_width=True
            )

        with b2:
            cancel = st.form_submit_button("Cancelar")

        # ==========================================
        # VALIDACIONES
        # ==========================================
        if submitted:

            if not hotel:
                st.error("Debe seleccionar un hotel.")
                st.stop()

            if not depto:
                st.error("Debe seleccionar un departamento.")
                st.stop()

            if not prioridad:
                st.error("Debe seleccionar una prioridad.")
                st.stop()

            if not tipo:
                st.error("Debe seleccionar un tipo de incidencia.")
                st.stop()

            if not impacto:
                st.error("Debe seleccionar un impacto.")
                st.stop()

            if not estatus:
                st.error("Debe seleccionar un estatus.")
                st.stop()

            if not normalize_text(descripcion):
                st.error("La descripción es obligatoria.")
                st.stop()

            pid = next_id(data["Pendientes"])

            new_row = pd.DataFrame(
                [[
                    pid,
                    datetime.now().strftime("%Y-%m-%d"),
                    hotel,
                    depto,
                    tipo,
                    impacto,
                    prioridad,
                    estatus,
                    fecha_comp.strftime("%Y-%m-%d") if fecha_comp else "",
                    descripcion.strip(),
                    "",
                    datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                ]],
                columns=PENDIENTES_COLUMNS
            )

            data["Pendientes"] = pd.concat(
                [data["Pendientes"], new_row],
                ignore_index=True
            )

            bit = pd.DataFrame(
                [[
                    pid,
                    datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    st.session_state.get("user", ""),
                    "Creación",
                    "Incidencia creada.",
                    "",
                    estatus
                ]],
                columns=BITACORA_COLUMNS
            )

            data["Bitacora"] = pd.concat(
                [data["Bitacora"], bit],
                ignore_index=True
            )

            save_data(data)

            for k in [
                "show_create",
                "new_hotel_modal",
                "new_depto_modal",
                "new_prioridad_modal",
                "new_tipo_modal",
                "new_impacto_modal",
                "new_estatus_modal",
                "new_fecha_modal",
                "new_descripcion_modal"
            ]:
                st.session_state.pop(k, None)

            st.success("Incidencia creada correctamente.")
            clear_cache_and_rerun()

        if cancel:

            for k in [
                "show_create",
                "new_hotel_modal",
                "new_depto_modal",
                "new_prioridad_modal",
                "new_tipo_modal",
                "new_impacto_modal",
                "new_estatus_modal",
                "new_fecha_modal",
                "new_descripcion_modal"
            ]:
                st.session_state.pop(k, None)

            st.rerun()
