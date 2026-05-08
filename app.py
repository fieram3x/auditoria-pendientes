import os
from io import BytesIO
from datetime import datetime, date
import pandas as pd
import streamlit as st
import plotly.express as px

APP_TITLE = "Auditoría Pendientes"
EXCEL_FILE = "auditoria_pendientes.xlsx"
SHEETS = ["Pendientes", "Bitacora", "Usuarios", "Catalogos"]

st.set_page_config(page_title=APP_TITLE, page_icon="🛡️", layout="wide", initial_sidebar_state="expanded")

# =========================
# Estilos - tema claro
# =========================
st.markdown("""
<style>
:root{
  --primary:#1a73e8;
  --primary-dark:#0b57d0;
  --bg:#f7faff;
  --card:#ffffff;
  --border:#e4eaf3;
  --text:#0f172a;
  --muted:#64748b;
  --success:#16a34a;
  --warn:#f59e0b;
  --danger:#ef4444;
}
.stApp { background: var(--bg); color: var(--text); }
.block-container { padding-top: 1.1rem; padding-bottom: 2rem; max-width: 1480px; }
[data-testid="stSidebar"] { background:#ffffff; border-right:1px solid var(--border); }
[data-testid="stSidebar"] * { color:#0f172a; }
hr { margin: .7rem 0 1rem; border-color:var(--border); }
.app-header {display:flex; align-items:center; justify-content:space-between; gap:1rem; margin-bottom:.9rem;}
.brand {display:flex; align-items:center; gap:.8rem;}
.logo {width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#1a73e8,#67a3ff);display:flex;align-items:center;justify-content:center;color:white;font-size:24px;box-shadow:0 8px 18px rgba(26,115,232,.18);}
.title h1 {font-size:26px;margin:0;line-height:1.05;color:#0f172a;font-weight:800;}
.title p {font-size:14px;margin:3px 0 0;color:#64748b;}
.user-pill {background:#fff;border:1px solid var(--border);border-radius:999px;padding:7px 12px;color:#334155;box-shadow:0 1px 4px rgba(15,23,42,.04);font-size:13px;}
.kpi-card {background:#fff;border:1px solid var(--border);border-radius:14px;padding:18px;box-shadow:0 1px 5px rgba(15,23,42,.05);min-height:105px;}
.kpi-label {font-size:14px;color:#0f172a;font-weight:650;margin-bottom:8px;}
.kpi-value {font-size:28px;font-weight:850;color:#0f172a;line-height:1;}
.kpi-sub {font-size:12.5px;color:#64748b;margin-top:8px;}
.filter-box {background:#fff;border:1px solid var(--border);border-radius:14px;padding:14px 16px;margin:.2rem 0 .8rem;box-shadow:0 1px 4px rgba(15,23,42,.04);}
.report-card {background:#fff;border:1px solid var(--border);border-radius:14px;box-shadow:0 1px 5px rgba(15,23,42,.05);overflow:hidden;margin-top:.7rem;}
.table-head, .table-row {display:grid; grid-template-columns: 105px 94px 86px 130px 150px 86px 140px minmax(220px,1fr) 86px; align-items:center; gap:10px;}
.table-head {background:#f8fbff;border-bottom:1px solid var(--border);font-weight:750;font-size:12.5px;color:#334155;padding:11px 14px;}
.table-row {padding:9px 14px;border-bottom:1px solid var(--border);font-size:12.5px;color:#0f172a;}
.table-row:hover {background:#f8fbff;}
.cell-muted {color:#64748b;}
.badge {display:inline-flex;align-items:center;justify-content:center;border-radius:8px;padding:4px 8px;font-size:12px;font-weight:700;line-height:1;border:1px solid transparent;white-space:nowrap;}
.badge-alta,.badge-crítica,.badge-critica {color:#dc2626;background:#fee2e2;border-color:#fecaca;}
.badge-media {color:#d97706;background:#fff7ed;border-color:#fed7aa;}
.badge-baja {color:#16a34a;background:#dcfce7;border-color:#bbf7d0;}
.badge-pendiente {color:#2563eb;background:#dbeafe;border-color:#bfdbfe;}
.badge-en-proceso {color:#d97706;background:#fff7ed;border-color:#fed7aa;}
.badge-en-espera-de-respuesta,.badge-escalado {color:#7c3aed;background:#ede9fe;border-color:#ddd6fe;}
.badge-resuelto,.badge-cerrado {color:#16a34a;background:#dcfce7;border-color:#bbf7d0;}
.badge-vencido {color:#dc2626;background:#fee2e2;border-color:#fecaca;}
.small-note {font-size:12px;color:#64748b;}
.detail-card {background:#fff;border:1px solid var(--border);border-radius:14px;padding:16px;box-shadow:0 1px 5px rgba(15,23,42,.05);height:100%;}
.detail-title {font-weight:800;color:#0f172a;margin-bottom:12px;}
.timeline {border-left:2px solid #dbeafe; margin-left:8px; padding-left:18px;}
.timeline-item {position:relative; margin-bottom:14px; padding-bottom:10px; border-bottom:1px solid #eef2f7;}
.timeline-item:before {content:""; position:absolute; left:-25px; top:3px; width:12px; height:12px; border-radius:50%; background:#1a73e8; box-shadow:0 0 0 4px #dbeafe;}
.stButton>button {border-radius:9px; border:1px solid var(--border); background:#ffffff; color:#0f172a; font-weight:650; padding:.36rem .62rem;}
.stButton>button:hover {border-color:#1a73e8;color:#1a73e8;background:#f8fbff;}
div[data-testid="stMetric"] {background:#fff;border:1px solid var(--border);border-radius:14px;padding:16px;box-shadow:0 1px 5px rgba(15,23,42,.05);}
section[data-testid="stSidebar"] .stButton>button {width:100%; justify-content:flex-start;}
@media (max-width: 1200px){.table-head,.table-row{grid-template-columns: 90px 85px 80px 115px 125px 75px 120px minmax(170px,1fr) 78px;font-size:11.5px;gap:7px;}.title h1{font-size:22px;}}

/* tabla compacta estilo reporte */
.row-actions {display:flex;align-items:center;justify-content:center;}
div[data-testid="stPopover"] button {min-width:36px !important; padding:.25rem .45rem !important; border-radius:10px !important;}
.action-menu-note {font-size:12px;color:#64748b;margin-bottom:6px;}
.edit-panel {background:#ffffff;border:1px solid var(--border);border-radius:14px;padding:16px;margin:.8rem 0;box-shadow:0 1px 6px rgba(15,23,42,.05);}

</style>
""", unsafe_allow_html=True)

# =========================
# Utilidades
# =========================
def normalize_text(value):
    if pd.isna(value) or value is None:
        return ""
    return str(value).strip()

def safe_date(value):
    if pd.isna(value) or value in [None, ""]:
        return ""
    try:
        return pd.to_datetime(value).strftime("%d/%m/%Y")
    except Exception:
        return str(value)

def badge(text, kind=""):
    t = normalize_text(text) or "Sin dato"
    k = (kind or t).lower().strip().replace(" ", "-").replace("/", "-")
    k = k.replace("á","a").replace("é","e").replace("í","i").replace("ó","o").replace("ú","u")
    return f'<span class="badge badge-{k}">{t}</span>'

def empty_df(name):
    if name == "Pendientes":
        return pd.DataFrame(columns=["ID","Fecha Creación","Hotel","Departamento","Tipo de Incidencia","Impacto","Prioridad","Estatus","Fecha Compromiso","Descripción","Fecha Cierre","Última Actualización"])
    if name == "Bitacora":
        return pd.DataFrame(columns=["ID Pendiente","Fecha","Usuario","Acción","Comentario","Estado Anterior","Estado Nuevo"])
    if name == "Usuarios":
        return pd.DataFrame(columns=["Usuario","Password","Nombre","Rol","Estado"])
    return pd.DataFrame(columns=["Categoria","Valor"])

def seed_data():
    usuarios = pd.DataFrame([
        ["admin","admin123","Administrador","Administrador","Activo"],
        ["auditor","auditor123","Auditor","Auditor","Activo"],
    ], columns=empty_df("Usuarios").columns)
    catalogos = []
    for v in ["5910 - PPRL","5911 - ZEL","5917 - MPCB","5918 - MCB","5930 - PGC"]: catalogos.append(["Hotel", v])
    for v in ["Recepción","Reservas","A&B","Spa","Contabilidad","IT","Club Meliá","Auditoría Nocturna","Auditoría Diurna"]: catalogos.append(["Departamento", v])
    for v in ["Cobro no realizado","Routing incorrecto","Check-in mal procesado","Rate Code incorrecto","Factura no volcada a SAP","Diferencia POS vs PMS","Resort Credit incorrecto","HTC incorrecto","Falta de soporte","Incidencia IT"]: catalogos.append(["Tipo de Incidencia", v])
    for v in ["Operativo","Financiero","Contable","Cliente","Sistema"]: catalogos.append(["Impacto", v])
    for v in ["Baja","Media","Alta","Crítica"]: catalogos.append(["Prioridad", v])
    for v in ["Pendiente","En proceso","En espera de respuesta","Escalado","Resuelto","Cerrado"]: catalogos.append(["Estatus", v])
    catalogos = pd.DataFrame(catalogos, columns=empty_df("Catalogos").columns)
    pendientes = pd.DataFrame([
        ["INC-2026-001", datetime.now().strftime("%Y-%m-%d"), "5918 - MCB", "Recepción", "Cobro no realizado", "Financiero", "Alta", "Pendiente", "", "Pendiente de validar cobro no realizado en recepción.", "", datetime.now().strftime("%Y-%m-%d %H:%M:%S")]
    ], columns=empty_df("Pendientes").columns)
    bit = pd.DataFrame([["INC-2026-001", datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "admin", "Creación", "Incidencia creada.", "", "Pendiente"]], columns=empty_df("Bitacora").columns)
    return {"Pendientes": pendientes, "Bitacora": bit, "Usuarios": usuarios, "Catalogos": catalogos}

def ensure_excel():
    if not os.path.exists(EXCEL_FILE):
        data = seed_data()
        with pd.ExcelWriter(EXCEL_FILE, engine="openpyxl") as writer:
            for sh in SHEETS:
                data[sh].to_excel(writer, sheet_name=sh, index=False)

def load_data():
    ensure_excel()
    try:
        xls = pd.read_excel(EXCEL_FILE, sheet_name=None, engine="openpyxl")
    except Exception:
        xls = seed_data()
        save_data(xls)
    data = {}
    for sh in SHEETS:
        data[sh] = xls.get(sh, empty_df(sh)).copy()
        for col in empty_df(sh).columns:
            if col not in data[sh].columns:
                data[sh][col] = ""
        data[sh] = data[sh][list(empty_df(sh).columns)]
        data[sh] = data[sh].fillna("")
    return data

def save_data(data):
    with pd.ExcelWriter(EXCEL_FILE, engine="openpyxl", mode="w") as writer:
        for sh in SHEETS:
            df = data.get(sh, empty_df(sh)).copy().fillna("")
            df.to_excel(writer, sheet_name=sh, index=False)

def clear_cache_and_rerun():
    st.cache_data.clear()
    st.rerun()

@st.cache_data(ttl=2)
def cached_load():
    return load_data()

def get_catalog(data, category, fallback=None):
    cat = data.get("Catalogos", empty_df("Catalogos"))
    vals = cat.loc[cat["Categoria"].astype(str).str.strip().eq(category), "Valor"].astype(str).str.strip().tolist()
    vals = [v for v in vals if v]
    return vals or (fallback or [])

def next_id(df):
    year = datetime.now().year
    nums = []
    for x in df.get("ID", []):
        s = str(x)
        if s.startswith(f"INC-{year}-"):
            try: nums.append(int(s.split("-")[-1]))
            except Exception: pass
    return f"INC-{year}-{(max(nums) + 1 if nums else 1):03d}"

def dynamic_options(df, col):
    vals = sorted([v for v in df[col].astype(str).str.strip().unique().tolist() if v and v.lower() != "nan"])
    return ["Todos"] + vals

def filtered_excel_bytes(df):
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Pendientes Filtrados")
    return output.getvalue()

# =========================
# Login
# =========================
def login_view(data):
    st.markdown("""
    <div style="max-width:430px;margin:8vh auto 0;background:#fff;border:1px solid #e4eaf3;border-radius:18px;padding:28px;box-shadow:0 12px 38px rgba(15,23,42,.08);">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
        <div class="logo">🛡️</div>
        <div class="title"><h1>Auditoría Pendientes</h1><p>Control y seguimiento de incidencias</p></div>
      </div>
    </div>
    """, unsafe_allow_html=True)
    with st.container():
        c1, c2, c3 = st.columns([1, 1.1, 1])
        with c2:
            usuario = st.text_input("Usuario")
            password = st.text_input("Contraseña", type="password")
            if st.button("Iniciar sesión", type="primary", use_container_width=True):
                users = data["Usuarios"]
                hit = users[(users["Usuario"].astype(str) == usuario) & (users["Password"].astype(str) == password) & (users["Estado"].astype(str) == "Activo")]
                if not hit.empty:
                    st.session_state["logged"] = True
                    st.session_state["user"] = usuario
                    st.session_state["name"] = hit.iloc[0]["Nombre"]
                    st.session_state["role"] = hit.iloc[0]["Rol"]
                    st.rerun()
                else:
                    st.error("Usuario o contraseña incorrectos.")
            st.caption("Usuarios demo: admin/admin123 | auditor/auditor123")

# =========================
# Header y navegación
# =========================
def header():
    st.markdown(f"""
    <div class="app-header">
      <div class="brand">
        <div class="logo">🛡️</div>
        <div class="title"><h1>{APP_TITLE}</h1><p>Control y seguimiento de incidencias</p></div>
      </div>
      <div class="user-pill">👤 {st.session_state.get('name','Usuario')} · {st.session_state.get('role','')}</div>
    </div>
    """, unsafe_allow_html=True)

def sidebar_nav():
    st.sidebar.markdown("### Menú")
    if "page" not in st.session_state:
        st.session_state.page = "Dashboard"
    pages = ["Dashboard", "Pendientes", "Bitácora"]
    if st.session_state.get("role") == "Administrador":
        pages += ["Usuarios", "Catálogos"]
    for p in pages:
        if st.sidebar.button(p, use_container_width=True, type="primary" if st.session_state.page == p else "secondary"):
            st.session_state.page = p
            st.rerun()
    st.sidebar.markdown("---")
    if st.sidebar.button("Cerrar sesión", use_container_width=True):
        for k in list(st.session_state.keys()):
            del st.session_state[k]
        st.rerun()

# =========================
# Filtros y tabla reporte
# =========================
def apply_filters(df):
    st.markdown('<div class="filter-box">', unsafe_allow_html=True)
    f1, f2, f3, f4, f5, f6 = st.columns([1.1,1.1,1.2,1,1,1.2])
    with f1: hotel = st.selectbox("Hotel", dynamic_options(df, "Hotel"), key="f_hotel")
    with f2: depto = st.selectbox("Departamento", dynamic_options(df, "Departamento"), key="f_depto")
    with f3: tipo = st.selectbox("Tipo de Incidencia", dynamic_options(df, "Tipo de Incidencia"), key="f_tipo")
    with f4: prioridad = st.selectbox("Prioridad", dynamic_options(df, "Prioridad"), key="f_prioridad")
    with f5: estatus = st.selectbox("Estatus", dynamic_options(df, "Estatus"), key="f_estatus")
    with f6:
        texto = st.text_input("Buscar", placeholder="ID, descripción, tipo...", key="f_texto")
    dff = df.copy()
    for col, val in [("Hotel", hotel), ("Departamento", depto), ("Tipo de Incidencia", tipo), ("Prioridad", prioridad), ("Estatus", estatus)]:
        if val != "Todos":
            dff = dff[dff[col].astype(str).eq(val)]
    if texto:
        q = texto.lower().strip()
        mask = dff.astype(str).apply(lambda r: r.str.lower().str.contains(q, na=False).any(), axis=1)
        dff = dff[mask]
    b1, b2, b3 = st.columns([.75, .9, 4])
    with b1:
        if st.button("↻ Limpiar filtros"):
            for k in ["f_hotel","f_depto","f_tipo","f_prioridad","f_estatus","f_texto"]:
                st.session_state.pop(k, None)
            st.rerun()
    with b2:
        st.download_button("⬇ Exportar", filtered_excel_bytes(dff), "pendientes_filtrados.xlsx", use_container_width=True)
    with b3:
        st.markdown(f'<div class="small-note" style="text-align:right;margin-top:9px;">Mostrando <b>{len(dff)}</b> resultado(s)</div>', unsafe_allow_html=True)
    st.markdown('</div>', unsafe_allow_html=True)
    return dff

def render_report_table(data, dff):
    estados = get_catalog(data, "Estatus", ["Pendiente","En proceso","En espera de respuesta","Escalado","Resuelto","Cerrado"])
    st.markdown('<div class="report-card">', unsafe_allow_html=True)
    st.markdown("""
    <div class="table-head">
      <div>ID</div><div>Fecha</div><div>Hotel</div><div>Departamento</div><div>Tipo de Incidencia</div><div>Prioridad</div><div>Estatus</div><div>Descripción</div><div>Acciones</div>
    </div>
    """, unsafe_allow_html=True)

    if dff.empty:
        st.info("No hay incidencias con los filtros seleccionados.")
        st.markdown('</div>', unsafe_allow_html=True)
        return

    for _, row in dff.reset_index().iterrows():
        original_index = int(row["index"])
        rid = str(row["ID"])
        fecha = safe_date(row["Fecha Creación"])
        hotel = str(row["Hotel"]).replace("5910 - ","").replace("5911 - ","").replace("5917 - ","").replace("5918 - ","").replace("5930 - ","")
        desc = str(row["Descripción"])
        if len(desc) > 92:
            desc = desc[:89] + "..."

        # Fila visual en formato reporte. Las acciones quedan compactas con tres puntos.
        st.markdown(f"""
        <div class="table-row">
          <div><b>{rid}</b></div>
          <div class="cell-muted">{fecha}</div>
          <div>{hotel}</div>
          <div>{row['Departamento']}</div>
          <div>{row['Tipo de Incidencia']}</div>
          <div>{badge(row['Prioridad'])}</div>
          <div>{badge(row['Estatus'])}</div>
          <div>{desc}</div>
          <div class="row-actions">⋮</div>
        </div>
        """, unsafe_allow_html=True)

        # Popover real de acciones alineado debajo del área de acciones, sin agrandar la fila.
        spacer, action_col = st.columns([9.2, .8])
        with action_col:
            with st.popover("⋮", use_container_width=True):
                st.markdown('<div class="action-menu-note">Acciones</div>', unsafe_allow_html=True)
                if st.button("Editar", key=f"edit_{rid}", use_container_width=True):
                    st.session_state["edit_id"] = rid
                    st.session_state["selected_id"] = rid
                    st.session_state["selected_idx"] = original_index
                    st.rerun()
                if st.button("Bitácora", key=f"bit_{rid}", use_container_width=True):
                    st.session_state["show_bitacora_id"] = rid
                    st.rerun()

    st.markdown('</div>', unsafe_allow_html=True)

    # Panel compacto de edición. Solo aparece cuando se presiona Acciones > Editar.
    edit_id = st.session_state.get("edit_id")
    if edit_id:
        df = data["Pendientes"]
        hit = df[df["ID"].astype(str) == edit_id]
        if not hit.empty:
            idx = hit.index[0]
            row = hit.iloc[0]
            st.markdown(f'<div class="edit-panel"><b>Editar incidencia {edit_id}</b></div>', unsafe_allow_html=True)
            with st.form(f"form_edit_{edit_id}"):
                c1, c2 = st.columns([.35, .65])
                with c1:
                    current_status = str(row["Estatus"])
                    pos = estados.index(current_status) if current_status in estados else 0
                    nuevo_estatus = st.selectbox("Nuevo estatus", estados, index=pos)
                with c2:
                    comentario = st.text_area("Comentario de actualización", placeholder="Agrega el comentario de seguimiento...", height=86)
                b1, b2 = st.columns([.22, .78])
                with b1:
                    guardar = st.form_submit_button("Guardar", type="primary", use_container_width=True)
                with b2:
                    cancelar = st.form_submit_button("Cancelar", use_container_width=False)

                if guardar:
                    anterior = str(data["Pendientes"].loc[idx, "Estatus"])
                    data["Pendientes"].loc[idx, "Estatus"] = str(nuevo_estatus)
                    data["Pendientes"].loc[idx, "Última Actualización"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    if nuevo_estatus in ["Resuelto", "Cerrado"] and not str(data["Pendientes"].loc[idx, "Fecha Cierre"]):
                        data["Pendientes"].loc[idx, "Fecha Cierre"] = datetime.now().strftime("%Y-%m-%d")
                    accion = "Cambio de estatus" if nuevo_estatus != anterior else "Comentario"
                    texto = comentario.strip() if comentario.strip() else "Actualización registrada desde el menú de acciones."
                    bit = pd.DataFrame([[edit_id, datetime.now().strftime("%Y-%m-%d %H:%M:%S"), st.session_state.get("user",""), accion, texto, anterior, nuevo_estatus]], columns=empty_df("Bitacora").columns)
                    data["Bitacora"] = pd.concat([data["Bitacora"], bit], ignore_index=True)
                    save_data(data)
                    st.session_state.pop("edit_id", None)
                    st.success("Incidencia actualizada correctamente.")
                    clear_cache_and_rerun()
                if cancelar:
                    st.session_state.pop("edit_id", None)
                    st.rerun()

    # Panel de bitácora. Solo aparece cuando se presiona Acciones > Bitácora.
    bit_id = st.session_state.get("show_bitacora_id")
    if bit_id:
        bit = data["Bitacora"]
        bit = bit[bit["ID Pendiente"].astype(str) == bit_id].copy().sort_values("Fecha", ascending=False)
        st.markdown(f'<div class="edit-panel"><b>Bitácora de {bit_id}</b></div>', unsafe_allow_html=True)
        if bit.empty:
            st.info("Esta incidencia todavía no tiene movimientos registrados.")
        else:
            st.dataframe(bit, use_container_width=True, hide_index=True)
        if st.button("Cerrar bitácora", key=f"close_bit_{bit_id}"):
            st.session_state.pop("show_bitacora_id", None)
            st.rerun()

def render_detail_panel(data):
    selected_id = st.session_state.get("selected_id")
    if not selected_id:
        return
    df = data["Pendientes"]
    hit = df[df["ID"].astype(str) == selected_id]
    if hit.empty:
        return
    row = hit.iloc[0]
    bit = data["Bitacora"]
    bit = bit[bit["ID Pendiente"].astype(str) == selected_id].copy()
    bit = bit.sort_values("Fecha", ascending=False)
    st.markdown("<br>", unsafe_allow_html=True)
    c1, c2 = st.columns([1, 1.1])
    with c1:
        st.markdown(f"""
        <div class="detail-card">
          <div class="detail-title">📄 Detalle de la incidencia</div>
          <div style="display:grid;grid-template-columns:130px 1fr;row-gap:9px;font-size:13px;">
            <div class="cell-muted">ID:</div><div><b>{row['ID']}</b></div>
            <div class="cell-muted">Fecha:</div><div>{safe_date(row['Fecha Creación'])}</div>
            <div class="cell-muted">Hotel:</div><div>{row['Hotel']}</div>
            <div class="cell-muted">Departamento:</div><div>{row['Departamento']}</div>
            <div class="cell-muted">Tipo:</div><div>{row['Tipo de Incidencia']}</div>
            <div class="cell-muted">Impacto:</div><div>{row['Impacto']}</div>
            <div class="cell-muted">Prioridad:</div><div>{badge(row['Prioridad'])}</div>
            <div class="cell-muted">Estatus:</div><div>{badge(row['Estatus'])}</div>
            <div class="cell-muted">Descripción:</div><div>{row['Descripción']}</div>
          </div>
        </div>
        """, unsafe_allow_html=True)
    with c2:
        st.markdown('<div class="detail-card">', unsafe_allow_html=True)
        h1, h2 = st.columns([1, .45])
        with h1: st.markdown('<div class="detail-title">🧾 Bitácora / Seguimiento</div>', unsafe_allow_html=True)
        with h2:
            if st.button("+ Nueva nota", key="new_note"):
                st.session_state["show_note"] = not st.session_state.get("show_note", False)
        if st.session_state.get("show_note", False):
            comentario = st.text_area("Comentario", key="note_comment")
            if st.button("Guardar nota", type="primary"):
                if comentario.strip():
                    new = pd.DataFrame([[selected_id, datetime.now().strftime("%Y-%m-%d %H:%M:%S"), st.session_state.get("user",""), "Comentario", comentario.strip(), "", row["Estatus"]]], columns=empty_df("Bitacora").columns)
                    data["Bitacora"] = pd.concat([data["Bitacora"], new], ignore_index=True)
                    save_data(data)
                    st.session_state["show_note"] = False
                    clear_cache_and_rerun()
        if bit.empty:
            st.caption("Sin movimientos registrados.")
        else:
            st.markdown('<div class="timeline">', unsafe_allow_html=True)
            for _, b in bit.head(8).iterrows():
                st.markdown(f"""
                <div class="timeline-item">
                  <div style="font-size:12.5px;color:#334155;"><b>{safe_date(b['Fecha'])}</b> · {b['Usuario']}</div>
                  <div style="font-size:13px;font-weight:750;color:#0f172a;margin-top:3px;">{b['Acción']}</div>
                  <div style="font-size:12.5px;color:#475569;margin-top:3px;">{b['Comentario']}</div>
                  <div style="font-size:11.5px;color:#64748b;margin-top:3px;">{b['Estado Anterior']} → {b['Estado Nuevo']}</div>
                </div>
                """, unsafe_allow_html=True)
            st.markdown('</div>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)

# =========================
# Páginas
# =========================
def kpi_cards(df):
    total = len(df)
    en_proceso = len(df[df["Estatus"].astype(str).eq("En proceso")])
    cerradas = len(df[df["Estatus"].astype(str).isin(["Cerrado","Resuelto"])])
    pendientes = len(df[df["Estatus"].astype(str).isin(["Pendiente","En espera de respuesta","Escalado"])])
    vencidas = 0
    if "Fecha Compromiso" in df.columns:
        fc = pd.to_datetime(df["Fecha Compromiso"], errors="coerce")
        vencidas = int(((fc < pd.Timestamp(date.today())) & (~df["Estatus"].astype(str).isin(["Cerrado","Resuelto"]))).sum())
    cols = st.columns(5)
    vals = [("Total Pendientes", total, "Todas las incidencias", "📋"), ("En Proceso", en_proceso, f"{(en_proceso/total*100 if total else 0):.1f}% del total", "⏱️"), ("Pendientes", pendientes, f"{(pendientes/total*100 if total else 0):.1f}% del total", "🕒"), ("Vencidas", vencidas, f"{(vencidas/total*100 if total else 0):.1f}% del total", "⚠️"), ("Completadas", cerradas, f"{(cerradas/total*100 if total else 0):.1f}% del total", "✅")]
    for col, (label, value, sub, icon) in zip(cols, vals):
        with col:
            st.markdown(f"""
            <div class="kpi-card">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div><div class="kpi-label">{label}</div><div class="kpi-value">{value}</div><div class="kpi-sub">{sub}</div></div>
                <div style="font-size:28px;opacity:.9;">{icon}</div>
              </div>
            </div>
            """, unsafe_allow_html=True)

def dashboard_page(data):
    df = data["Pendientes"].copy()
    kpi_cards(df)
    dff = apply_filters(df)
    render_report_table(data, dff)
    st.markdown("<br>", unsafe_allow_html=True)
    g1, g2 = st.columns(2)
    with g1:
        st.markdown('<div class="detail-card"><div class="detail-title">Incidencias por departamento</div>', unsafe_allow_html=True)
        if not dff.empty:
            fig = px.bar(dff.groupby("Departamento").size().reset_index(name="Cantidad"), x="Departamento", y="Cantidad", text="Cantidad")
            fig.update_layout(margin=dict(l=10,r=10,t=10,b=10), height=300, paper_bgcolor="white", plot_bgcolor="white")
            st.plotly_chart(fig, use_container_width=True)
        st.markdown('</div>', unsafe_allow_html=True)
    with g2:
        st.markdown('<div class="detail-card"><div class="detail-title">Tipos de incidencia más comunes</div>', unsafe_allow_html=True)
        if not dff.empty:
            top = dff.groupby("Tipo de Incidencia").size().reset_index(name="Cantidad").sort_values("Cantidad", ascending=False).head(8)
            fig = px.bar(top, x="Cantidad", y="Tipo de Incidencia", orientation="h", text="Cantidad")
            fig.update_layout(margin=dict(l=10,r=10,t=10,b=10), height=300, paper_bgcolor="white", plot_bgcolor="white")
            st.plotly_chart(fig, use_container_width=True)
        st.markdown('</div>', unsafe_allow_html=True)

def pendientes_page(data):
    top1, top2 = st.columns([1, .22])
    with top1:
        st.subheader("Pendientes / Incidencias")
        st.caption("Reporte operativo con filtros dinámicos y actualización directa de estatus.")
    with top2:
        if st.button("+ Nueva incidencia", type="primary", use_container_width=True):
            st.session_state["show_create"] = not st.session_state.get("show_create", False)
    if st.session_state.get("show_create", False):
        with st.form("crear_inc", clear_on_submit=True):
            st.markdown("#### Nueva incidencia")
            c1, c2, c3 = st.columns(3)
            with c1:
                hotel = st.selectbox("Hotel", get_catalog(data, "Hotel"))
                depto = st.selectbox("Departamento", get_catalog(data, "Departamento"))
                prioridad = st.selectbox("Prioridad", get_catalog(data, "Prioridad"))
            with c2:
                tipo = st.selectbox("Tipo de Incidencia", get_catalog(data, "Tipo de Incidencia"))
                impacto = st.selectbox("Impacto", get_catalog(data, "Impacto"))
                estatus = st.selectbox("Estatus inicial", get_catalog(data, "Estatus"), index=0)
            with c3:
                fecha_comp = st.date_input("Fecha compromiso", value=None)
                descripcion = st.text_area("Descripción", height=100)
            submitted = st.form_submit_button("Guardar incidencia", type="primary")
            if submitted:
                if not descripcion.strip():
                    st.error("La descripción es obligatoria.")
                else:
                    pid = next_id(data["Pendientes"])
                    row = pd.DataFrame([[pid, datetime.now().strftime("%Y-%m-%d"), hotel, depto, tipo, impacto, prioridad, estatus, fecha_comp.strftime("%Y-%m-%d") if fecha_comp else "", descripcion.strip(), "", datetime.now().strftime("%Y-%m-%d %H:%M:%S")]], columns=empty_df("Pendientes").columns)
                    data["Pendientes"] = pd.concat([data["Pendientes"], row], ignore_index=True)
                    bit = pd.DataFrame([[pid, datetime.now().strftime("%Y-%m-%d %H:%M:%S"), st.session_state.get("user",""), "Creación", "Incidencia creada.", "", estatus]], columns=empty_df("Bitacora").columns)
                    data["Bitacora"] = pd.concat([data["Bitacora"], bit], ignore_index=True)
                    save_data(data)
                    st.success("Incidencia creada correctamente.")
                    st.session_state["show_create"] = False
                    clear_cache_and_rerun()
    dff = apply_filters(data["Pendientes"].copy())
    render_report_table(data, dff)

def bitacora_page(data):
    st.subheader("Bitácora general")
    bit = data["Bitacora"].copy()
    q = st.text_input("Buscar en bitácora", placeholder="ID, usuario, comentario...")
    if q:
        mask = bit.astype(str).apply(lambda r: r.str.lower().str.contains(q.lower(), na=False).any(), axis=1)
        bit = bit[mask]
    st.dataframe(bit.sort_values("Fecha", ascending=False), use_container_width=True, hide_index=True)

def usuarios_page(data):
    st.subheader("Gestión de usuarios")
    st.caption("Solo disponible para Administrador.")
    with st.form("new_user"):
        c1, c2, c3, c4 = st.columns(4)
        with c1: usuario = st.text_input("Usuario")
        with c2: nombre = st.text_input("Nombre")
        with c3: password = st.text_input("Contraseña")
        with c4:
            rol = st.selectbox("Rol", ["Administrador", "Auditor"])
            estado = st.selectbox("Estado", ["Activo", "Inactivo"])
        if st.form_submit_button("Guardar usuario", type="primary"):
            if usuario and password and nombre:
                users = data["Usuarios"].copy()
                if usuario in users["Usuario"].astype(str).tolist():
                    idx = users.index[users["Usuario"].astype(str).eq(usuario)][0]
                    users.loc[idx, ["Password","Nombre","Rol","Estado"]] = [password, nombre, rol, estado]
                else:
                    users = pd.concat([users, pd.DataFrame([[usuario,password,nombre,rol,estado]], columns=empty_df("Usuarios").columns)], ignore_index=True)
                data["Usuarios"] = users
                save_data(data)
                st.success("Usuario guardado.")
                clear_cache_and_rerun()
            else:
                st.error("Usuario, nombre y contraseña son obligatorios.")
    st.dataframe(data["Usuarios"].drop(columns=["Password"], errors="ignore"), use_container_width=True, hide_index=True)

def catalogos_page(data):
    st.subheader("Catálogos")
    st.caption("Valores usados en los dropdowns de la app.")
    cat = data["Catalogos"].copy()
    edited = st.data_editor(cat, use_container_width=True, hide_index=True, num_rows="dynamic")
    if st.button("Guardar catálogos", type="primary"):
        data["Catalogos"] = edited.fillna("")
        save_data(data)
        st.success("Catálogos actualizados.")
        clear_cache_and_rerun()

# =========================
# Main
# =========================
def main():
    data = cached_load()
    if not st.session_state.get("logged"):
        login_view(data)
        return
    sidebar_nav()
    header()
    page = st.session_state.get("page", "Dashboard")
    if page == "Dashboard":
        dashboard_page(data)
    elif page == "Pendientes":
        pendientes_page(data)
    elif page == "Bitácora":
        bitacora_page(data)
    elif page == "Usuarios" and st.session_state.get("role") == "Administrador":
        usuarios_page(data)
    elif page == "Catálogos" and st.session_state.get("role") == "Administrador":
        catalogos_page(data)
    else:
        st.warning("No tienes acceso a este módulo.")

if __name__ == "__main__":
    main()
