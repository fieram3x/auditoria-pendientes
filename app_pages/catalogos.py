import pandas as pd
import streamlit as st

from components import page_title
from constants import CATALOGOS_COLUMNS, DEFAULT_CATALOGS, SHEET_CATALOGOS
from database import clear_cache_and_rerun, persist_changes, validate_catalogs


def _default_rows():
    rows = []
    for category, values in DEFAULT_CATALOGS.items():
        for value in values:
            rows.append([category, value])
    return pd.DataFrame(rows, columns=CATALOGOS_COLUMNS)


def catalogos_page(data):
    page_title("Catálogos", "Valores disponibles para desplegables, responsables y cierre formal.")

    cat = data[SHEET_CATALOGOS].copy()
    missing_defaults = _default_rows()
    existing_pairs = set(zip(cat["Categoria"].astype(str).str.lower().str.strip(), cat["Valor"].astype(str).str.lower().str.strip()))
    missing_defaults = missing_defaults[
        ~missing_defaults.apply(lambda row: (row["Categoria"].lower().strip(), row["Valor"].lower().strip()) in existing_pairs, axis=1)
    ]
    if not missing_defaults.empty:
        with st.expander("Catálogos sugeridos faltantes"):
            st.dataframe(missing_defaults, use_container_width=True, hide_index=True)
            if st.button("Agregar sugeridos", type="primary"):
                data[SHEET_CATALOGOS] = pd.concat([cat, missing_defaults], ignore_index=True)
                persist_changes(data, replaced_sheets=[SHEET_CATALOGOS])
                clear_cache_and_rerun()

    edited = st.data_editor(
        cat,
        use_container_width=True,
        hide_index=True,
        num_rows="dynamic",
        column_config={
            "Categoria": st.column_config.TextColumn("Categoría", required=True),
            "Valor": st.column_config.TextColumn("Valor", required=True),
        },
    )

    if st.button("Guardar catálogos", type="primary"):
        cleaned, duplicates = validate_catalogs(edited)
        if not duplicates.empty:
            st.error("Hay valores duplicados por categoría. Corrige antes de guardar.")
            st.dataframe(duplicates, use_container_width=True, hide_index=True)
            return
        data[SHEET_CATALOGOS] = cleaned
        persist_changes(data, replaced_sheets=[SHEET_CATALOGOS])
        st.success("Catálogos actualizados.")
        clear_cache_and_rerun()
