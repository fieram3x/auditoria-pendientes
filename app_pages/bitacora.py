import pandas as pd
import streamlit as st

from components import page_title, render_timeline
from constants import SHEET_BITACORA, SHEET_PENDIENTES
from ui_utils import normalize_text


def _unique(df, column):
    if column not in df.columns:
        return []
    vals = sorted([
        normalize_text(v)
        for v in df[column].dropna().astype(str).tolist()
        if normalize_text(v)
    ])
    return list(dict.fromkeys(vals))


def bitacora_page(data):
    page_title("Bitácora general", "Auditoría completa de cambios, comentarios y accesos.")
    bit = data[SHEET_BITACORA].copy()
    pend = data[SHEET_PENDIENTES].copy()

    if not pend.empty and "ID" in pend.columns:
        lookup = pend[["ID", "Hotel"]].rename(columns={"ID": "ID Pendiente", "Hotel": "Hotel Pendiente"})
        bit = bit.merge(lookup, on="ID Pendiente", how="left")
        bit["Hotel"] = bit["Hotel"].where(bit["Hotel"].astype(str).str.strip() != "", bit["Hotel Pendiente"].fillna(""))
        bit = bit.drop(columns=["Hotel Pendiente"])

    st.markdown('<div class="filter-box">', unsafe_allow_html=True)
    c1, c2, c3, c4, c5, c6 = st.columns([.95, .95, 1.05, 1.05, .9, 1.1])
    with c1:
        fecha_desde = st.date_input("Fecha desde", value=None, key="bit_fecha_desde")
    with c2:
        fecha_hasta = st.date_input("Fecha hasta", value=None, key="bit_fecha_hasta")
    with c3:
        usuarios = st.multiselect("Usuario", _unique(bit, "Usuario"), key="bit_usuario")
    with c4:
        acciones = st.multiselect("Acción", _unique(bit, "Acción"), key="bit_accion")
    with c5:
        hoteles = st.multiselect("Hotel", _unique(bit, "Hotel"), key="bit_hotel")
    with c6:
        estatus = st.multiselect("Estatus", _unique(bit, "Estatus"), key="bit_estatus")
    q = st.text_input("Buscar ID o comentario", placeholder="ID, campo, valor, comentario...", key="bit_q")
    st.markdown("</div>", unsafe_allow_html=True)

    dff = bit.copy()
    fechas = pd.to_datetime(dff.get("Fecha", pd.Series(dtype=str)), errors="coerce").dt.date
    if fecha_desde:
        dff = dff[fechas >= fecha_desde]
        fechas = pd.to_datetime(dff.get("Fecha", pd.Series(dtype=str)), errors="coerce").dt.date
    if fecha_hasta:
        dff = dff[fechas <= fecha_hasta]

    for column, values in {
        "Usuario": usuarios,
        "Acción": acciones,
        "Hotel": hoteles,
        "Estatus": estatus,
    }.items():
        if values and column in dff.columns:
            dff = dff[dff[column].astype(str).isin(values)]

    if q:
        query = q.lower().strip()
        mask = dff.astype(str).apply(lambda row: row.str.lower().str.contains(query, na=False).any(), axis=1)
        dff = dff[mask]

    st.caption(f"Mostrando {len(dff)} movimiento(s).")
    tabs = st.tabs(["Tabla", "Línea de tiempo"])
    with tabs[0]:
        cols = [
            "Fecha",
            "Usuario",
            "ID Pendiente",
            "Hotel",
            "Acción",
            "Campo modificado",
            "Valor anterior",
            "Valor nuevo",
            "Comentario",
            "Estatus",
        ]
        st.dataframe(dff[[c for c in cols if c in dff.columns]].sort_values("Fecha", ascending=False), use_container_width=True, hide_index=True)
    with tabs[1]:
        render_timeline(dff)
