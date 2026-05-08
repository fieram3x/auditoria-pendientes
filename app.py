import os
from io import BytesIO
from datetime import datetime, date
import pandas as pd
import streamlit as st
import plotly.express as px

APP_TITLE = "Auditoría Pendientes"
EXCEL_FILE = "auditoria_pendientes.xlsx"
SHEETS = ["Pendientes", "Bitacora", "Usuarios", "Catalogos"]
CLOSED_STATUS = ["Resuelto", "Cerrado"]

st.set_page_config(
    page_title=APP_TITLE,
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# =========================
# CSS / Tema claro profesional
# =========================
st.markdown("""
<style>
:root{
  --primary:#1a73e8;
  --primary-soft:#e8f1ff;
  --bg:#f6f9fe;
  --card:#ffffff;
  --border:#dfe7f2;
  --text:#0f172a;
  --muted:#64748b;
  --success:#16a34a;
  --warn:#f59e0b;
  --danger:#ef4444;
}
.stApp { background: var(--bg); color: var(--text); }
.block-container { padding-top: 1rem; padding-bottom: 2rem; max-width: 1560px; }
[data-testid="stSidebar"] { background:#ffffff; border-right:1px solid var(--border); }
[data-testid="stSidebar"] * { color:#0f172a; }
[data-testid="stHeader"] { background: rgba(246,249,254,.92); }
hr { margin: .7rem 0 1rem; border-color:var(--border); }

.app-header{
  display:flex; align-items:center; justify-content:space-between;
  gap:1rem; margin-bottom:1rem; background:#fff; border:1px solid var(--border);
  border-radius:18px; padding:16px 18px; box-shadow:0 1px 6px rgba(15,23,42,.05);
}
.brand {display:flex; align-items:center; gap:.8rem;}
.logo {width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#1a73e8,#67a3ff);display:flex;align-items:center;justify-content:center;color:white;font-size:24px;box-shadow:0 8px 18px rgba(26,115,232,.18);}
.title h1 {font-size:27px;margin:0;line-height:1.05;color:#0f172a;font-weight:850;}
.title p {font-size:14px;margin:4px 0 0;color:#64748b;}
.user-pill {background:#f8fbff;border:1px solid var(--border);border-radius:999px;padding:8px 13px;color:#334155;box-shadow:0 1px 4px rgba(15,23,42,.04);font-size:13px;white-space:nowrap;}

.kpi-card {background:#fff;border:1px solid var(--border);border-radius:16px;padding:18px;box-shadow:0 1px 5px rgba(15,23,42,.05);min-height:104px;}
.kpi-label {font-size:13.5px;color:#334155;font-weight:700;margin-bottom:8px;}
.kpi-value {font-size:28px;font-weight:850;color:#0f172a;line-height:1;}
.kpi-sub {font-size:12.5px;color:#64748b;margin-top:8px;}

.filter-box {background:#fff;border:1px solid var(--border);border-radius:16px;padding:14px 16px;margin:.4rem 0 1rem;box-shadow:0 1px 4px rgba(15,23,42,.04);}
.report-card {background:#fff;border:1px solid var(--border);border-radius:16px;box-shadow:0 1px 7px rgba(15,23,42,.05);overflow:hidden;margin-top:.6rem;}
.table-head {
  background:#f8fbff;border-bottom:1px solid var(--border);
  font-weight:800;font-size:12.5px;color:#334155;padding:12px 14px;
}
.table-row {padding:10px 14px;border-bottom:1px solid var(--border);font-size:12.5px;color:#0f172a;}
.table-row:hover {background:#f8fbff;}
.cell-muted {color:#64748b;}

.badge {display:inline-flex;align-items:center;justify-content:center;border-radius:8px;padding:5px 9px;font-size:12px;font-weight:800;line-height:1;border:1px solid transparent;white-space:nowrap;}
.badge-alta,.badge-crítica,.badge-critica {color:#dc2626;background:#fee2e2;border-color:#fecaca;}
.badge-media {color:#d97706;background:#fff7ed;border-color:#fed7aa;}
.badge-baja {color:#16a34a;background:#dcfce7;border-color:#bbf7d0;}
.badge-pendiente {color:#2563eb;background:#dbeafe;border-color:#bfdbfe;}
.badge-en-proceso {color:#d97706;background:#fff7ed;border-color:#fed7aa;}
.badge-en-espera-de-respuesta,.badge-escalado {color:#7c3aed;background:#ede9fe;border-color:#ddd6fe;}
.badge-resuelto,.badge-cerrado {color:#16a34a;background:#dcfce7;border-color:#bbf7d0;}
.badge-vencido {color:#dc2626;background:#fee2e2;border-color:#fecaca;}

.small-note {font-size:12px;color:#64748b;}
.panel {background:#fff;border:1px solid var(--border);border-radius:16px;padding:16px;box-shadow:0 1px 6px rgba(15,23,42,.05);margin-top:12px;}
.panel-title {font-weight:850;color:#0f172a;margin-bottom:10px;font-size:17px;}
.timeline-item {background:#fff;border:1px solid #e4eaf3;border-radius:12px;padding:14px;margin-bottom:10px;}
.timeline-meta {display:flex;justify-content:space-between;gap:10px;align-items:center;font-size:12px;color:#64748b;}
.timeline-title {font-weight:800;color:#0f172a;margin-top:5px;font-size:13.5px;}
.timeline-comment {font-size:13px;color:#475569;margin-top:6px;line-height:1.35;}

.stButton>button {border-radius:10px; border:1px solid var(--border); background:#ffffff; color:#0f172a; font-weight:700; padding:.36rem .62rem;}
.stButton>button:hover {border-color:#1a73e8;color:#1a73e8;background:#f8fbff;}
div[data-testid="stPopover"] button {border-radius:10px !important;}
.action-menu-note {font-size:12px;color:#64748b;margin-bottom:6px;}

div[data-testid="stMetric"] {background:#fff;border:1px solid var(--border);border-radius:16px;padding:16px;box-shadow:0 1px 5px rgba(15,23,42,.05);}
section[data-testid="stSidebar"] .stButton>button {width:100%; justify-content:flex-start;}

.login-box{
  max-width:460px;margin:7vh auto 0;background:#fff;border:1px solid #e4eaf3;border-radius:18px;
  padding:26px;box-shadow:0 12px 38px rgba(15,23,42,.08);
}
@media (max-width: 1200px){
  .title h1{font-size:23px;}
  .table-head,.table-row{font-size:11.5px;}
}
</style>
""", unsafe_allow_html=True)


# =========================
# Utilidades
# =========================
def normalize_text(value):
    if pd.isna(value) or value is None:
        return ""
    return str(value).strip()

def safe_date(value, with_time=False):
    if pd.isna(value) or value in [None, ""]:
        return ""
    try:
        fmt = "%d/%m/%Y %H:%M" if with_time else "%d/%m/%Y"
        return pd.to_datetime(value).strftime(fmt)
    except Exception:
        return str(value)

def badge(text, kind=""):
    t = normalize_text(text) or "Sin dato"
    k = (kind or t).lower().strip().replace(" ", "-").replace("/", "-")
    k = k.replace("á","a").replace("é","e").replace("í","i").replace("ó","o").replace("ú","u")
    return f'<span class="badge badge-{k}">{t}</span>'

def empty_df(name):
    if name == "Pendientes":
        return pd.DataFrame(columns=[
            "ID","Fecha Creación","Hotel","Departamento","Tipo de Incidencia",
            "Impacto","Prioridad","Estatus","Fecha Compromiso","Descripción",
            "Fecha Cierre","Última Actualización"
        ])
    if name == "Bitacora":
        return pd.DataFrame(columns=[
            "ID Pendiente","Fecha","Usuario","Acción","Comentario","Estado Anterior","Estado Nuevo"
        ])
    if name == "Usuarios":
        return pd.DataFrame(columns=["Usuario","Password","Nombre","Rol","Estado"])
    return pd.DataFrame(columns=["Categoria","Valor"])

def seed_data():
    usuarios = pd.DataFrame([
        ["admin","admin123","Administrador","Administrador","Activo"],
        ["auditor","auditor123","Auditor","Auditor","Activo"],
    ], columns=empty_df("Usuarios").columns)

    catalogos = []
    for v in ["5910 - PPRL","5911 - ZEL","5917 - MPCB","5918 - MCB","5930 - PGC"]:
        catalogos.append(["Hotel", v])
    for v in ["Recepción","Reservas","A&B","Spa","Contabilidad","IT","Club Meliá","Auditoría Nocturna","Auditoría Diurna"]:
        catalogos.append(["Departamento", v])
    for v in ["Cobro no realizado","Routing incorrecto","Check-in mal procesado","Rate Code incorrecto","Factura no volcada a SAP","Diferencia POS vs PMS","Resort Credit incorrecto","HTC incorrecto","Falta de soporte","Incidencia IT"]:
        catalogos.append(["Tipo de Incidencia", v])
    for v in ["Operativo","Financiero","Contable","Cliente","Sistema"]:
        catalogos.append(["Impacto", v])
    for v in ["Baja","Media","Alta","Crítica"]:
        catalogos.append(["Prioridad", v])
    for v in ["Pendiente","En proceso","En espera de respuesta","Escalado","Resuelto","Cerrado"]:
        catalogos.append(["Estatus", v])

    return {
        "Pendientes": empty_df("Pendientes"),
        "Bitacora": empty_df("Bitacora"),
        "Usuarios": usuarios,
        "Catalogos": pd.DataFrame(catalogos, columns=empty_df("Catalogos").columns)
    }

def ensure_excel():
    if not os.path.exists(EXCEL_FILE):
        save_data(seed_data())

def clean_loaded_sheet(df, name):
    expected = empty_df(name).columns.tolist()

    # Compatibilidad por si el Excel tenía nombres anteriores
    rename_map = {
        "Contraseña": "Password",
        "Activo": "Estado",
        "Fecha": "Fecha Creación",
        "Ultima Actualización": "Última Actualización"
    }
    df = df.rename(columns=rename_map).copy()

    for col in expected:
        if col not in df.columns:
            df[col] = ""
    df = df[expected].fillna("")

    # Normalización de usuarios antiguos
    if name == "Usuarios":
        if "Estado" in df.columns:
            df["Estado"] = df["Estado"].replace({"Sí": "Activo", "Si": "Activo", "TRUE": "Activo", True: "Activo", "No": "Inactivo", False: "Inactivo"})
    return df

def load_data():
    ensure_excel()
    try:
        xls = pd.read_excel(EXCEL_FILE, sheet_name=None, engine="openpyxl")
    except Exception:
        data = seed_data()
        save_data(data)
        return data

    data = {}
    for sh in SHEETS:
        data[sh] = clean_loaded_sheet(xls.get(sh, empty_df(sh)), sh)

    # Si no hay usuarios válidos, restaura usuarios iniciales sin tocar pendientes
    if data["Usuarios"].empty or "admin" not in data["Usuarios"]["Usuario"].astype(str).tolist():
        data["Usuarios"] = seed_data()["Usuarios"]
        save_data(data)

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
    vals = cat.loc[
        cat["Categoria"].astype(str).str.strip().eq(category),
        "Valor"
    ].astype(str).str.strip().tolist()
    vals = [v for v in vals if v and v.lower() != "nan"]
    return vals or (fallback or [])

def next_id(df):
    year = datetime.now().year
    nums = []
    for x in df.get("ID", []):
        s = str(x)
        if s.startswith(f"INC-{year}-"):
            try:
                nums.append(int(s.split("-")[-1]))
            except Exception:
                pass
    return f"INC-{year}-{(max(nums) + 1 if nums else 1):03d}"

def dynamic_options(df, col):
    if col not in df.columns or df.empty:
        return ["Todos"]
    vals = sorted([v for v in df[col].astype(str).str.strip().unique().tolist() if v and v.lower() != "nan"])
    return ["Todos"] + vals

def filtered_excel_bytes(df):
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Pendientes Filtrados")
    return output.getvalue()

def short_hotel(value):
    return str(value).replace("5910 - ","").replace("5911 - ","").replace("5917 - ","").replace("5918 - ","").replace("5930 - ","")

def is_overdue(row):
    try:
        fc = pd.to_datetime(row.get("Fecha Compromiso", ""), errors="coerce")
        if pd.isna(fc):
            return False
        return fc.date() < date.today() and str(row.get("Estatus","")) not in CLOSED_STATUS
    except Exception:
        return False


# =========================
# Login
# =========================
def login_view(data):
    st.markdown(f"""
    <div class="login-box">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
        <div class="logo">🛡️</div>
        <div class="title"><h1>{APP_TITLE}</h1><p>Control y seguimiento de incidencias</p></div>
      </div>
    </div>
    """, unsafe_allow_html=True)

    c1, c2, c3 = st.columns([1, 1.05, 1])
    with c2:
        st.subheader("Inicio de sesión")
        usuario = st.text_input("Usuario")
        password = st.text_input("Contraseña", type="password")
        if st.button("Entrar", type="primary", use_container_width=True):
            users = data["Usuarios"].copy()
            users["Usuario"] = users["Usuario"].astype(str).str.strip()
            users["Password"] = users["Password"].astype(str).str.strip()
            users["Estado"] = users["Estado"].astype(str).str.strip()

            hit = users[
                (users["Usuario"] == usuario.strip()) &
                (users["Password"] == password.strip()) &
                (users["Estado"].str.lower() == "activo")
            ]
            if not hit.empty:
                st.session_state["logged"] = True
                st.session_state["user"] = usuario.strip()
                st.session_state["name"] = hit.iloc[0]["Nombre"]
                st.session_state["role"] = hit.iloc[0]["Rol"]
                st.rerun()
            else:
                st.error("Usuario o contraseña incorrectos, o usuario inactivo.")
      


# =========================
# Header y navegación
# =========================
def header():
    st.markdown(f"""
    <div class="app-header">
      <div class="brand">
        <div class="logo">🛡️</div>
        <div class="title"><h1>{APP_TITLE}</h1><p>Control y seguimiento de incidencias de auditoría</p></div>
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
    with f1:
        hotel = st.selectbox("Hotel", dynamic_options(df, "Hotel"), key="f_hotel")
    with f2:
        depto = st.selectbox("Departamento", dynamic_options(df, "Departamento"), key="f_depto")
    with f3:
        tipo = st.selectbox("Tipo de Incidencia", dynamic_options(df, "Tipo de Incidencia"), key="f_tipo")
    with f4:
        prioridad = st.selectbox("Prioridad", dynamic_options(df, "Prioridad"), key="f_prioridad")
    with f5:
        estatus = st.selectbox("Estatus", dynamic_options(df, "Estatus"), key="f_estatus")
    with f6:
        texto = st.text_input("Buscar", placeholder="ID, descripción, tipo...", key="f_texto")

    dff = df.copy()
    for col, val in [("Hotel", hotel), ("Departamento", depto), ("Tipo de Incidencia", tipo), ("Prioridad", prioridad), ("Estatus", estatus)]:
        if val != "Todos" and col in dff.columns:
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

def table_header():
    st.markdown('<div class="report-card">', unsafe_allow_html=True)
    st.markdown('<div class="table-head">', unsafe_allow_html=True)
    cols = st.columns([1.05,.95,.85,1.3,1.55,.9,1.15,2.4,.65])
    headers = ["ID","Fecha","Hotel","Departamento","Tipo de Incidencia","Prioridad","Estatus","Descripción","Acciones"]
    for col, text in zip(cols, headers):
        with col:
            st.markdown(f"**{text}**")
    st.markdown('</div>', unsafe_allow_html=True)

def render_row(row, original_index, data, estados):
    rid = str(row["ID"])
    fecha = safe_date(row["Fecha Creación"])
    desc = str(row["Descripción"])
    if len(desc) > 105:
        desc = desc[:102] + "..."

    st.markdown('<div class="table-row">', unsafe_allow_html=True)
    cols = st.columns([1.05,.95,.85,1.3,1.55,.9,1.15,2.4,.65])

    with cols[0]:
        st.markdown(f"**{rid}**")
    with cols[1]:
        st.markdown(f'<span class="cell-muted">{fecha}</span>', unsafe_allow_html=True)
    with cols[2]:
        st.markdown(short_hotel(row["Hotel"]))
    with cols[3]:
        st.markdown(str(row["Departamento"]))
    with cols[4]:
        st.markdown(str(row["Tipo de Incidencia"]))
    with cols[5]:
        st.markdown(badge(row["Prioridad"]), unsafe_allow_html=True)
    with cols[6]:
        st.markdown(badge(row["Estatus"]), unsafe_allow_html=True)
    with cols[7]:
        st.markdown(desc)
    with cols[8]:
        with st.popover("⋮"):
            st.markdown('<div class="action-menu-note"><b>Acciones</b></div>', unsafe_allow_html=True)
            if st.button("✏️ Editar", key=f"edit_{rid}", use_container_width=True):
                st.session_state["edit_id"] = rid
                st.rerun()
            if st.button("🧾 Bitácora", key=f"bit_{rid}", use_container_width=True):
                st.session_state["show_bitacora_id"] = rid
                st.rerun()

    st.markdown('</div>', unsafe_allow_html=True)

def render_report_table(data, dff):
    estados = get_catalog(data, "Estatus", ["Pendiente","En proceso","En espera de respuesta","Escalado","Resuelto","Cerrado"])

    table_header()

    if dff.empty:
        st.info("No hay incidencias con los filtros seleccionados.")
        st.markdown('</div>', unsafe_allow_html=True)
        return

    for _, row in dff.reset_index().iterrows():
        render_row(row, int(row["index"]), data, estados)

    st.markdown('</div>', unsafe_allow_html=True)

    render_edit_panel(data, estados)
    render_bitacora_panel(data)

def render_edit_panel(data, estados):
    edit_id = st.session_state.get("edit_id")
    if not edit_id:
        return

    df = data["Pendientes"]
    hit = df[df["ID"].astype(str) == edit_id]
    if hit.empty:
        st.session_state.pop("edit_id", None)
        return

    idx = hit.index[0]
    row = hit.iloc[0]

    st.markdown(f"""
    <div class="panel">
      <div class="panel-title">✏️ Editar incidencia</div>
      <div class="small-note">{edit_id} · {row['Hotel']} · {row['Departamento']}</div>
    </div>
    """, unsafe_allow_html=True)

    with st.form(f"form_edit_{edit_id}"):
        c1, c2 = st.columns([.35, .65])
        with c1:
            current_status = str(row["Estatus"])
            pos = estados.index(current_status) if current_status in estados else 0
            nuevo_estatus = st.selectbox("Nuevo estatus", estados, index=pos)
        with c2:
            comentario = st.text_area("Comentario de actualización", placeholder="Agrega el comentario de seguimiento...", height=92)

        b1, b2 = st.columns([.22, .78])
        with b1:
            guardar = st.form_submit_button("Guardar", type="primary", use_container_width=True)
        with b2:
            cancelar = st.form_submit_button("Cancelar")

        if guardar:
            anterior = str(data["Pendientes"].loc[idx, "Estatus"])
            data["Pendientes"].loc[idx, "Estatus"] = str(nuevo_estatus)
            data["Pendientes"].loc[idx, "Última Actualización"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            if nuevo_estatus in CLOSED_STATUS and not str(data["Pendientes"].loc[idx, "Fecha Cierre"]):
                data["Pendientes"].loc[idx, "Fecha Cierre"] = datetime.now().strftime("%Y-%m-%d")

            accion = "Cambio de estatus" if nuevo_estatus != anterior else "Comentario"
            texto = comentario.strip() if comentario.strip() else "Actualización registrada desde el menú de acciones."

            bit = pd.DataFrame([[
                edit_id,
                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                st.session_state.get("user",""),
                accion,
                texto,
                anterior,
                nuevo_estatus
            ]], columns=empty_df("Bitacora").columns)

            data["Bitacora"] = pd.concat([data["Bitacora"], bit], ignore_index=True)
            save_data(data)
            st.session_state.pop("edit_id", None)
            st.success("Incidencia actualizada correctamente.")
            clear_cache_and_rerun()

        if cancelar:
            st.session_state.pop("edit_id", None)
            st.rerun()

def render_bitacora_panel(data):
    bit_id = st.session_state.get("show_bitacora_id")
    if not bit_id:
        return

    bit = data["Bitacora"]
    bit = bit[bit["ID Pendiente"].astype(str) == bit_id].copy().sort_values("Fecha", ascending=False)

    st.markdown(f"""
    <div class="panel">
      <div class="panel-title">🧾 Bitácora de incidencia</div>
      <div class="small-note">{bit_id}</div>
    </div>
    """, unsafe_allow_html=True)

    if bit.empty:
        st.info("Esta incidencia todavía no tiene movimientos registrados.")
    else:
        for _, b in bit.iterrows():
            st.markdown(f"""
            <div class="timeline-item">
                <div class="timeline-meta">
                    <span><b>{b['Acción']}</b> · {b['Usuario']}</span>
                    <span>{safe_date(b['Fecha'], with_time=True)}</span>
                </div>
                <div class="timeline-comment">{b['Comentario']}</div>
                <div class="small-note" style="margin-top:8px;">{b['Estado Anterior']} → {b['Estado Nuevo']}</div>
            </div>
            """, unsafe_allow_html=True)

    if st.button("Cerrar bitácora", key=f"close_bit_{bit_id}"):
        st.session_state.pop("show_bitacora_id", None)
        st.rerun()


# =========================
# Páginas
# =========================
def kpi_cards(df):
    total = len(df)
    en_proceso = len(df[df["Estatus"].astype(str).eq("En proceso")])
    cerradas = len(df[df["Estatus"].astype(str).isin(CLOSED_STATUS)])
    pendientes = len(df[df["Estatus"].astype(str).isin(["Pendiente","En espera de respuesta","Escalado"])])
    vencidas = 0
    if not df.empty and "Fecha Compromiso" in df.columns:
        vencidas = int(df.apply(is_overdue, axis=1).sum())

    cols = st.columns(5)
    vals = [
        ("Total Pendientes", total, "Todas las incidencias", "📋"),
        ("En Proceso", en_proceso, f"{(en_proceso/total*100 if total else 0):.1f}% del total", "⏱️"),
        ("Pendientes", pendientes, f"{(pendientes/total*100 if total else 0):.1f}% del total", "🕒"),
        ("Vencidas", vencidas, f"{(vencidas/total*100 if total else 0):.1f}% del total", "⚠️"),
        ("Completadas", cerradas, f"{(cerradas/total*100 if total else 0):.1f}% del total", "✅")
    ]

    for col, (label, value, sub, icon) in zip(cols, vals):
        with col:
            st.markdown(f"""
            <div class="kpi-card">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <div class="kpi-label">{label}</div>
                  <div class="kpi-value">{value}</div>
                  <div class="kpi-sub">{sub}</div>
                </div>
                <div style="font-size:28px;opacity:.9;">{icon}</div>
              </div>
            </div>
            """, unsafe_allow_html=True)

def dashboard_page(data):
    df = data["Pendientes"].copy()
    kpi_cards(df)
    dff = apply_filters(df)

    if dff.empty:
        st.info("No hay datos para mostrar con los filtros seleccionados.")
        return

    g1, g2 = st.columns(2)
    with g1:
        st.markdown('<div class="panel"><div class="panel-title">Incidencias por departamento</div>', unsafe_allow_html=True)
        fig = px.bar(
            dff.groupby("Departamento").size().reset_index(name="Cantidad"),
            x="Departamento", y="Cantidad", text="Cantidad"
        )
        fig.update_layout(margin=dict(l=10,r=10,t=10,b=10), height=320, paper_bgcolor="white", plot_bgcolor="white")
        st.plotly_chart(fig, use_container_width=True)
        st.markdown('</div>', unsafe_allow_html=True)

    with g2:
        st.markdown('<div class="panel"><div class="panel-title">Tipos de incidencia más comunes</div>', unsafe_allow_html=True)
        top = dff.groupby("Tipo de Incidencia").size().reset_index(name="Cantidad").sort_values("Cantidad", ascending=False).head(8)
        fig = px.bar(top, x="Cantidad", y="Tipo de Incidencia", orientation="h", text="Cantidad")
        fig.update_layout(margin=dict(l=10,r=10,t=10,b=10), height=320, paper_bgcolor="white", plot_bgcolor="white")
        st.plotly_chart(fig, use_container_width=True)
        st.markdown('</div>', unsafe_allow_html=True)

    st.markdown("### Reporte filtrado")
    render_report_table(data, dff)

def pendientes_page(data):
    top1, top2 = st.columns([1, .22])
    with top1:
        st.subheader("Pendientes / Incidencias")
        st.caption("Reporte operativo con filtros dinámicos y actualización mediante acciones.")
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
                descripcion = st.text_area("Descripción", height=105)

            submitted = st.form_submit_button("Guardar incidencia", type="primary")
            if submitted:
                if not descripcion.strip():
                    st.error("La descripción es obligatoria.")
                else:
                    pid = next_id(data["Pendientes"])
                    row = pd.DataFrame([[
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
                    ]], columns=empty_df("Pendientes").columns)

                    data["Pendientes"] = pd.concat([data["Pendientes"], row], ignore_index=True)
                    bit = pd.DataFrame([[
                        pid,
                        datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        st.session_state.get("user",""),
                        "Creación",
                        "Incidencia creada.",
                        "",
                        estatus
                    ]], columns=empty_df("Bitacora").columns)

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

    if bit.empty:
        st.info("No hay movimientos registrados.")
    else:
        st.dataframe(bit.sort_values("Fecha", ascending=False), use_container_width=True, hide_index=True)

def usuarios_page(data):
    st.subheader("Gestión de usuarios")
    st.caption("Solo disponible para Administrador.")

    st.markdown("### Crear usuario")

    with st.form("crear_usuario", clear_on_submit=True):
        c1, c2, c3, c4 = st.columns(4)

        with c1:
            usuario = st.text_input("Usuario")
        with c2:
            nombre = st.text_input("Nombre")
        with c3:
            password = st.text_input("Contraseña", type="password")
        with c4:
            rol = st.selectbox("Rol", ["Administrador", "Auditor"])
            estado = st.selectbox("Estado", ["Activo", "Inactivo"])

        guardar = st.form_submit_button("Crear usuario", type="primary")

        if guardar:
            if not usuario or not nombre or not password:
                st.error("Usuario, nombre y contraseña son obligatorios.")
            else:
                users = data["Usuarios"].copy()

                if usuario in users["Usuario"].astype(str).tolist():
                    st.error("Este usuario ya existe. Edítalo desde la tabla inferior.")
                else:
                    nuevo = pd.DataFrame(
                        [[usuario, password, nombre, rol, estado]],
                        columns=empty_df("Usuarios").columns
                    )
                    data["Usuarios"] = pd.concat([users, nuevo], ignore_index=True)
                    save_data(data)
                    st.success("Usuario creado correctamente.")
                    clear_cache_and_rerun()

    st.markdown("---")
    st.markdown("### Editar usuarios existentes")
    st.caption("Puedes modificar nombre, contraseña, rol y estado directamente en la tabla.")

    edited_users = st.data_editor(
        data["Usuarios"],
        use_container_width=True,
        hide_index=True,
        num_rows="fixed",
        disabled=["Usuario"]
    )

    if st.button("Guardar cambios de usuarios", type="primary"):
        data["Usuarios"] = edited_users.fillna("")
        save_data(data)
        st.success("Usuarios actualizados correctamente.")
        clear_cache_and_rerun()

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
