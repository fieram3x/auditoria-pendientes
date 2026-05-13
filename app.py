import os
from io import BytesIO
from datetime import datetime, date

import pandas as pd
import plotly.express as px
import streamlit as st

import gspread
from google.oauth2.service_account import Credentials


APP_TITLE = "Auditoría Pendientes"
SPREADSHEET_NAME = "auditoria_pendientes"

SHEETS = ["Pendientes", "Bitacora", "Usuarios", "Catalogos"]

PENDIENTES_COLUMNS = [
    "ID", "Fecha Creación", "Hotel", "Departamento", "Tipo de Incidencia",
    "Impacto", "Prioridad", "Estatus", "Fecha Compromiso", "Descripción",
    "Fecha Cierre", "Última Actualización"
]

BITACORA_COLUMNS = [
    "ID Pendiente", "Fecha", "Usuario", "Acción", "Comentario",
    "Estado Anterior", "Estado Nuevo"
]

USUARIOS_COLUMNS = ["Usuario", "Password", "Nombre", "Rol", "Estado"]
CATALOGOS_COLUMNS = ["Categoria", "Valor"]

CLOSED_STATUS = ["Resuelto", "Cerrado"]


st.set_page_config(
    page_title=APP_TITLE,
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)


# ==========================================================
# ESTILO VISUAL - TEMA CLARO CORPORATIVO
# ==========================================================
st.markdown(
    """
<style>
:root{
    --primary:#2563eb;
    --primary-2:#1d4ed8;
    --primary-soft:#eff6ff;
    --bg:#f5f8fc;
    --surface:#ffffff;
    --surface-2:#f8fbff;
    --border:#e5edf7;
    --border-2:#d7e2f0;
    --text:#0f172a;
    --muted:#64748b;
    --muted-2:#94a3b8;
    --green:#16a34a;
    --orange:#d97706;
    --red:#dc2626;
    --purple:#7c3aed;
    --shadow:0 8px 24px rgba(15,23,42,.06);
}

.stApp {
    background:
        radial-gradient(circle at top left, rgba(37,99,235,.08), transparent 30%),
        var(--bg);
    color: var(--text);
}

.block-container {
    padding-top: 1.15rem;
    padding-bottom: 2rem;
    max-width: 1520px;
}

[data-testid="stSidebar"] {
    background:#ffffff;
    border-right:1px solid var(--border);
    box-shadow: 6px 0 20px rgba(15,23,42,.025);
}

[data-testid="stSidebar"] * {
    color:#0f172a;
}

.stDeployButton,
[data-testid="stToolbar"],
[data-testid="stDecoration"],

.app-shell {
    background:rgba(255,255,255,.72);
    border:1px solid rgba(229,237,247,.9);
    border-radius:22px;
    padding:18px 20px;
    box-shadow:var(--shadow);
    margin-bottom:16px;
}

.app-header {
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:1rem;
}

.brand {
    display:flex;
    align-items:center;
    gap:.85rem;
}

.logo {
    width:46px;
    height:46px;
    border-radius:15px;
    background:linear-gradient(135deg,#2563eb,#60a5fa);
    display:flex;
    align-items:center;
    justify-content:center;
    color:white;
    font-size:24px;
    box-shadow:0 10px 22px rgba(37,99,235,.24);
}

.title h1 {
    font-size:26px;
    margin:0;
    line-height:1.05;
    color:#0f172a;
    font-weight:900;
    letter-spacing:-.3px;
}

.title p {
    font-size:13.5px;
    margin:4px 0 0;
    color:#64748b;
}

.user-pill {
    background:#fff;
    border:1px solid var(--border);
    border-radius:999px;
    padding:8px 14px;
    color:#334155;
    box-shadow:0 1px 5px rgba(15,23,42,.04);
    font-size:13px;
    white-space:nowrap;
}

.login-card {
    max-width:500px;
    margin:6vh auto 0;
    background:#fff;
    border:1px solid var(--border);
    border-radius:24px;
    padding:30px;
    box-shadow:0 18px 45px rgba(15,23,42,.09);
}

.section-title {
    display:flex;
    align-items:flex-end;
    justify-content:space-between;
    gap:1rem;
    margin: 2px 0 10px;
}

.section-title h2 {
    margin:0;
    font-size:22px;
    font-weight:900;
    color:#0f172a;
    letter-spacing:-.2px;
}

.section-title p {
    margin:4px 0 0;
    color:#64748b;
    font-size:13px;
}

.kpi-card {
    background:#fff;
    border:1px solid var(--border);
    border-radius:18px;
    padding:16px 18px;
    box-shadow:0 3px 12px rgba(15,23,42,.045);
    min-height:104px;
}

.kpi-label {
    font-size:13px;
    color:#64748b;
    font-weight:700;
    margin-bottom:8px;
}

.kpi-value {
    font-size:29px;
    font-weight:900;
    color:#0f172a;
    line-height:1;
}

.kpi-sub {
    font-size:12px;
    color:#94a3b8;
    margin-top:8px;
}

.kpi-icon {
    width:38px;
    height:38px;
    border-radius:13px;
    background:#eff6ff;
    color:#2563eb;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:20px;
}

.filter-box {
    background:#fff;
    border:1px solid var(--border);
    border-radius:18px;
    padding:16px 16px 12px;
    margin:.2rem 0 .8rem;
    box-shadow:0 3px 14px rgba(15,23,42,.04);
}

.report-card {
    background:#fff;
    border:1px solid var(--border);
    border-radius:18px;
    box-shadow:0 3px 14px rgba(15,23,42,.045);
    overflow:hidden;
    margin-top:.75rem;
}

.table-header {
    background:linear-gradient(180deg,#f8fbff,#f4f8ff);
    border-bottom:1px solid var(--border);
    font-weight:900;
    font-size:12px;
    color:#334155;
    padding:11px 13px;
    text-transform:uppercase;
    letter-spacing:.25px;
}

.table-row-wrap {
    border-bottom:1px solid #eef3f9;
    padding:8px 13px;
    transition: all .14s ease-in-out;
}

.table-row-wrap:hover {
    background:#f8fbff;
}

.cell-text {
    font-size:12.5px;
    color:#0f172a;
    line-height:1.25;
}

.cell-muted {
    color:#64748b;
    font-size:12.5px;
}

.badge {
    display:inline-flex;
    align-items:center;
    justify-content:center;
    border-radius:999px;
    padding:5px 9px;
    font-size:11.5px;
    font-weight:850;
    line-height:1;
    border:1px solid transparent;
    white-space:nowrap;
}

.badge-alta,.badge-critica,.badge-crítica {
    color:#dc2626;
    background:#fee2e2;
    border-color:#fecaca;
}

.badge-media {
    color:#d97706;
    background:#fff7ed;
    border-color:#fed7aa;
}

.badge-baja {
    color:#16a34a;
    background:#dcfce7;
    border-color:#bbf7d0;
}

.badge-pendiente {
    color:#2563eb;
    background:#dbeafe;
    border-color:#bfdbfe;
}

.badge-en-proceso {
    color:#d97706;
    background:#fff7ed;
    border-color:#fed7aa;
}

.badge-en-espera-de-respuesta,
.badge-escalado {
    color:#7c3aed;
    background:#ede9fe;
    border-color:#ddd6fe;
}

.badge-resuelto,
.badge-cerrado {
    color:#16a34a;
    background:#dcfce7;
    border-color:#bbf7d0;
}

.badge-vencido {
    color:#dc2626;
    background:#fee2e2;
    border-color:#fecaca;
}

.small-note {
    font-size:12px;
    color:#64748b;
}

.detail-card,
.edit-panel,
.user-panel {
    background:#fff;
    border:1px solid var(--border);
    border-radius:18px;
    padding:16px;
    box-shadow:0 3px 14px rgba(15,23,42,.045);
}

.detail-title {
    font-weight:900;
    color:#0f172a;
    margin-bottom:12px;
}

.timeline-card {
    background:white;
    border:1px solid #e4eaf3;
    border-radius:14px;
    padding:14px;
    margin-bottom:10px;
}

.user-row {
    border:1px solid var(--border);
    background:#fff;
    border-radius:14px;
    padding:10px 12px;
    margin-bottom:9px;
    box-shadow:0 1px 5px rgba(15,23,42,.03);
}

.stButton>button {
    border-radius:10px;
    border:1px solid var(--border-2);
    background:#ffffff;
    color:#0f172a;
    font-weight:750;
    padding:.38rem .65rem;
}

.stButton>button:hover {
    border-color:#2563eb;
    color:#2563eb;
    background:#f8fbff;
}

.stButton>button[kind="primary"] {
    border-color:#2563eb !important;
    background:#2563eb !important;
    color:white !important;
}

div[data-testid="stPopover"] button {
    min-width:34px !important;
    border-radius:10px !important;
}

.action-menu-note {
    font-size:12px;
    color:#64748b;
    margin-bottom:6px;
}

hr {
    margin: .8rem 0 1rem;
    border-color:var(--border);
}

@media (max-width: 1200px){
    .title h1{font-size:22px;}
    .user-pill{display:none;}
}
</style>
""",
    unsafe_allow_html=True
)


# ==========================================================
# UTILIDADES
# ==========================================================
def normalize_text(value):
    if pd.isna(value) or value is None:
        return ""
    return str(value).strip()


def safe_date(value, with_time=False):
    if pd.isna(value) or value in [None, ""]:
        return ""
    try:
        fmt = "%d/%m/%Y %I:%M %p" if with_time else "%d/%m/%Y"
        return pd.to_datetime(value).strftime(fmt)
    except Exception:
        return str(value)


def slug(value):
    s = normalize_text(value).lower().replace(" ", "-").replace("/", "-")
    replacements = {"á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u"}
    for a, b in replacements.items():
        s = s.replace(a, b)
    return s


def badge(text):
    t = normalize_text(text) or "Sin dato"
    return f'<span class="badge badge-{slug(t)}">{t}</span>'


def empty_df(name):
    if name == "Pendientes":
        return pd.DataFrame(columns=PENDIENTES_COLUMNS)
    if name == "Bitacora":
        return pd.DataFrame(columns=BITACORA_COLUMNS)
    if name == "Usuarios":
        return pd.DataFrame(columns=USUARIOS_COLUMNS)
    return pd.DataFrame(columns=CATALOGOS_COLUMNS)


def seed_data():
    usuarios = pd.DataFrame(
        [["admin", "admin123", "Administrador", "Administrador", "Activo"]],
        columns=USUARIOS_COLUMNS
    )

    catalogos_rows = []
    for v in ["5910 - PPRL", "5911 - ZEL", "5917 - MPCB", "5918 - MCB", "5930 - PGC"]:
        catalogos_rows.append(["Hotel", v])
    for v in ["Recepción", "Reservas", "A&B", "Spa", "Contabilidad", "IT", "Club Meliá", "Auditoría Nocturna", "Auditoría Diurna"]:
        catalogos_rows.append(["Departamento", v])
    for v in ["Cobro no realizado", "Routing incorrecto", "Check-in mal procesado", "Rate Code incorrecto", "Factura no volcada a SAP", "Diferencia POS vs PMS", "Resort Credit incorrecto", "HTC incorrecto", "Falta de soporte", "Incidencia IT"]:
        catalogos_rows.append(["Tipo de Incidencia", v])
    for v in ["Operativo", "Financiero", "Contable", "Cliente", "Sistema"]:
        catalogos_rows.append(["Impacto", v])
    for v in ["Baja", "Media", "Alta", "Crítica"]:
        catalogos_rows.append(["Prioridad", v])
    for v in ["Pendiente", "En proceso", "En espera de respuesta", "Escalado", "Resuelto", "Cerrado"]:
        catalogos_rows.append(["Estatus", v])

    catalogos = pd.DataFrame(catalogos_rows, columns=CATALOGOS_COLUMNS)

    return {
        "Pendientes": empty_df("Pendientes"),
        "Bitacora": empty_df("Bitacora"),
        "Usuarios": usuarios,
        "Catalogos": catalogos
    }


# ==========================================================
# GOOGLE SHEETS
# ==========================================================
def conectar_google_sheets():
    scope = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
    ]

    creds = Credentials.from_service_account_info(
        st.secrets["google_service_account"],
        scopes=scope
    )

    client = gspread.authorize(creds)
    return client.open(SPREADSHEET_NAME)


def migrate_columns(df, sheet_name):
    if sheet_name == "Usuarios":
        if "Contraseña" in df.columns and "Password" not in df.columns:
            df = df.rename(columns={"Contraseña": "Password"})
        if "Activo" in df.columns and "Estado" not in df.columns:
            df = df.rename(columns={"Activo": "Estado"})

    target = empty_df(sheet_name)

    for col in target.columns:
        if col not in df.columns:
            df[col] = ""

    df = df[list(target.columns)].fillna("")

    if sheet_name == "Usuarios":
        df["Estado"] = df["Estado"].replace({
            "Sí": "Activo", "Si": "Activo", "No": "Inactivo",
            True: "Activo", False: "Inactivo"
        })
        df.loc[df["Estado"].astype(str).str.strip() == "", "Estado"] = "Activo"

    return df


def load_data():
    spreadsheet = conectar_google_sheets()
    data = {}

    seed = seed_data()

    for sheet_name in SHEETS:
        try:
            worksheet = spreadsheet.worksheet(sheet_name)
            records = worksheet.get_all_records()
            df = pd.DataFrame(records) if records else empty_df(sheet_name)

        except Exception:
            worksheet = spreadsheet.add_worksheet(
                title=sheet_name,
                rows=1000,
                cols=50
            )

            df = seed.get(sheet_name, empty_df(sheet_name))

            worksheet.update(
                [df.columns.values.tolist()] + df.fillna("").values.tolist()
            )

        data[sheet_name] = migrate_columns(df.copy(), sheet_name)

    return data


def save_data(data):
    spreadsheet = conectar_google_sheets()

    for sheet_name in SHEETS:
        df = data.get(sheet_name, empty_df(sheet_name)).copy().fillna("")
        df = migrate_columns(df, sheet_name)

        try:
            worksheet = spreadsheet.worksheet(sheet_name)
        except Exception:
            worksheet = spreadsheet.add_worksheet(
                title=sheet_name,
                rows=1000,
                cols=50
            )

        worksheet.clear()
        worksheet.update(
            [df.columns.values.tolist()] + df.values.tolist()
        )


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
    vals = [v for v in vals if v]
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
    if col not in df.columns:
        return ["Todos"]

    vals = sorted([
        v for v in df[col].astype(str).str.strip().unique().tolist()
        if v and v.lower() != "nan"
    ])
    return ["Todos"] + vals


def filtered_excel_bytes(df):
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Pendientes Filtrados")
    return output.getvalue()


def close_status_if_needed(data, idx, new_status):
    if new_status in CLOSED_STATUS and not normalize_text(data["Pendientes"].loc[idx, "Fecha Cierre"]):
        data["Pendientes"].loc[idx, "Fecha Cierre"] = datetime.now().strftime("%Y-%m-%d")
    elif new_status not in CLOSED_STATUS:
        data["Pendientes"].loc[idx, "Fecha Cierre"] = ""


# ==========================================================
# LOGIN
# ==========================================================
def login_view(data):
    st.markdown(
        f"""
        <div class="login-card">
            <div style="display:flex;align-items:center;gap:14px;">
                <div class="logo">🛡️</div>
                <div class="title">
                    <h1>{APP_TITLE}</h1>
                    <p>Control y seguimiento de incidencias</p>
                </div>
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )

    c1, c2, c3 = st.columns([1.1, 1, 1.1])

    with c2:
        st.markdown("### Inicio de sesión")
        usuario = st.text_input("Usuario", placeholder="Ingrese su usuario")
        password = st.text_input("Contraseña", type="password", placeholder="Ingrese su contraseña")

        if st.button("Entrar", type="primary", use_container_width=True):
            users = data["Usuarios"].copy()
            hit = users[
                (users["Usuario"].astype(str) == usuario)
                & (users["Password"].astype(str) == password)
                & (users["Estado"].astype(str) == "Activo")
            ]

            if hit.empty:
                st.error("Usuario o contraseña incorrectos, o usuario inactivo.")
            else:
                row = hit.iloc[0]
                st.session_state["logged"] = True
                st.session_state["user"] = str(row["Usuario"])
                st.session_state["name"] = str(row["Nombre"])
                st.session_state["role"] = str(row["Rol"])
                st.rerun()


# ==========================================================
# HEADER / NAVEGACIÓN
# ==========================================================
def header():
    st.markdown(
        f"""
        <div class="app-shell">
            <div class="app-header">
                <div class="brand">
                    <div class="logo">🛡️</div>
                    <div class="title">
                        <h1>{APP_TITLE}</h1>
                        <p>Monitor operativo de incidencias y pendientes de auditoría</p>
                    </div>
                </div>
                <div class="user-pill">👤 {st.session_state.get("name", "Usuario")} · {st.session_state.get("role", "")}</div>
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )


def sidebar_nav():
    st.sidebar.markdown("### 🛡️ Auditoría")
    st.sidebar.caption("Panel de control")

    if "page" not in st.session_state:
        st.session_state.page = "Dashboard"

    pages = ["Dashboard", "Pendientes", "Bitácora"]

    if st.session_state.get("role") == "Administrador":
        pages += ["Usuarios", "Catálogos"]

    for page in pages:
        icon = {
            "Dashboard": "📊",
            "Pendientes": "📋",
            "Bitácora": "🧾",
            "Usuarios": "👥",
            "Catálogos": "⚙️",
        }.get(page, "•")

        if st.sidebar.button(
            f"{icon} {page}",
            use_container_width=True,
            type="primary" if st.session_state.page == page else "secondary"
        ):
            if st.session_state.page != page:
                st.session_state.pop("edit_id", None)
                st.session_state.pop("show_bitacora_id", None)
            st.session_state.page = page
            st.rerun()

    st.sidebar.markdown("---")
    st.sidebar.caption(f"Usuario: {st.session_state.get('user', '')}")

    if st.sidebar.button("Cerrar sesión", use_container_width=True):
        for key in list(st.session_state.keys()):
            del st.session_state[key]
        st.rerun()


def page_title(title, subtitle="", button_label=None, button_key=None):
    left, right = st.columns([1, .25])

    with left:
        st.markdown(
            f"""
            <div class="section-title">
                <div>
                    <h2>{title}</h2>
                    <p>{subtitle}</p>
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )

    if button_label and button_key:
        with right:
            clicked = st.button(button_label, type="primary", use_container_width=True, key=button_key)
            return clicked

    return False


# ==========================================================
# FILTROS
# ==========================================================
def options_from_filtered_df(df, column, filters=None):
    """Devuelve opciones dinámicas tomando en cuenta los filtros ya seleccionados."""
    if column not in df.columns:
        return ["Todos"]

    temp = df.copy()
    filters = filters or {}

    for f_col, f_val in filters.items():
        if f_col != column and f_val and f_val != "Todos" and f_col in temp.columns:
            temp = temp[temp[f_col].astype(str).eq(str(f_val))]

    vals = sorted([
        v for v in temp[column].astype(str).str.strip().unique().tolist()
        if v and v.lower() != "nan"
    ])

    return ["Todos"] + vals


def normalize_filter_value(key, options):
    """Evita errores cuando un filtro anterior deja sin valor válido a otro filtro."""
    current = st.session_state.get(key, "Todos")
    if current not in options:
        st.session_state[key] = "Todos"
        return "Todos"
    return current


def apply_filters(df, key_prefix="f"):
    st.markdown('<div class="filter-box">', unsafe_allow_html=True)

    cols_filter = {
        "Hotel": f"{key_prefix}_hotel",
        "Departamento": f"{key_prefix}_depto",
        "Tipo de Incidencia": f"{key_prefix}_tipo",
        "Prioridad": f"{key_prefix}_prioridad",
        "Estatus": f"{key_prefix}_estatus",
    }

    selected = {
        col: st.session_state.get(key, "Todos")
        for col, key in cols_filter.items()
    }

    f1, f2, f3, f4, f5, f6 = st.columns([1.05, 1.15, 1.25, .9, 1, 1.25])

    with f1:
        hotel_options = options_from_filtered_df(df, "Hotel", selected)
        hotel = st.selectbox(
            "Hotel",
            hotel_options,
            index=hotel_options.index(normalize_filter_value(cols_filter["Hotel"], hotel_options)),
            key=cols_filter["Hotel"]
        )
        selected["Hotel"] = hotel

    with f2:
        depto_options = options_from_filtered_df(df, "Departamento", selected)
        depto = st.selectbox(
            "Departamento",
            depto_options,
            index=depto_options.index(normalize_filter_value(cols_filter["Departamento"], depto_options)),
            key=cols_filter["Departamento"]
        )
        selected["Departamento"] = depto

    with f3:
        tipo_options = options_from_filtered_df(df, "Tipo de Incidencia", selected)
        tipo = st.selectbox(
            "Tipo de Incidencia",
            tipo_options,
            index=tipo_options.index(normalize_filter_value(cols_filter["Tipo de Incidencia"], tipo_options)),
            key=cols_filter["Tipo de Incidencia"]
        )
        selected["Tipo de Incidencia"] = tipo

    with f4:
        prioridad_options = options_from_filtered_df(df, "Prioridad", selected)
        prioridad = st.selectbox(
            "Prioridad",
            prioridad_options,
            index=prioridad_options.index(normalize_filter_value(cols_filter["Prioridad"], prioridad_options)),
            key=cols_filter["Prioridad"]
        )
        selected["Prioridad"] = prioridad

    with f5:
        estatus_options = options_from_filtered_df(df, "Estatus", selected)
        estatus = st.selectbox(
            "Estatus",
            estatus_options,
            index=estatus_options.index(normalize_filter_value(cols_filter["Estatus"], estatus_options)),
            key=cols_filter["Estatus"]
        )
        selected["Estatus"] = estatus

    with f6:
        texto_key = f"{key_prefix}_texto"
        texto = st.text_input("Buscar", placeholder="ID, descripción, comentario...", key=texto_key)

    dff = df.copy()

    for col, val in selected.items():
        if val != "Todos" and col in dff.columns:
            dff = dff[dff[col].astype(str).eq(str(val))]

    if texto:
        q = texto.lower().strip()
        mask = dff.astype(str).apply(
            lambda r: r.str.lower().str.contains(q, na=False).any(),
            axis=1
        )
        dff = dff[mask]

    b1, b2, b3 = st.columns([.8, .9, 4])

    with b1:
        if st.button("↻ Limpiar filtros", key=f"{key_prefix}_clear_filters"):
            for k in list(cols_filter.values()) + [texto_key]:
                st.session_state.pop(k, None)
            st.rerun()

    with b2:
        st.download_button(
            "⬇ Exportar",
            filtered_excel_bytes(dff),
            "pendientes_filtrados.xlsx",
            use_container_width=True,
            key=f"{key_prefix}_export"
        )

    with b3:
        st.markdown(
            f'<div class="small-note" style="text-align:right;margin-top:9px;">Mostrando <b>{len(dff)}</b> resultado(s)</div>',
            unsafe_allow_html=True
        )

    st.markdown('</div>', unsafe_allow_html=True)
    return dff

# ==========================================================
# TABLA DE INCIDENCIAS
# ==========================================================
def render_report_table(data, dff):
    estados = get_catalog(
        data,
        "Estatus",
        ["Pendiente", "En proceso", "En espera de respuesta", "Escalado", "Resuelto", "Cerrado"]
    )

    st.markdown('<div class="report-card">', unsafe_allow_html=True)
    st.markdown('<div class="table-header">', unsafe_allow_html=True)

    h = st.columns([1.05, .9, .75, 1.15, 1.4, .85, 1.15, 2.2, .52])
    for col, title in zip(
        h,
        ["ID", "Fecha", "Hotel", "Departamento", "Tipo", "Prioridad", "Estatus", "Descripción", "Acciones"]
    ):
        with col:
            st.markdown(title)

    st.markdown('</div>', unsafe_allow_html=True)

    if dff.empty:
        st.info("No hay incidencias con los filtros seleccionados.")
        st.markdown('</div>', unsafe_allow_html=True)
        return

    for _, row in dff.reset_index().iterrows():
        rid = str(row["ID"])
        desc = str(row["Descripción"])
        desc_short = desc if len(desc) <= 105 else desc[:102] + "..."

        hotel_short = (
            str(row["Hotel"])
            .replace("5910 - ", "")
            .replace("5911 - ", "")
            .replace("5917 - ", "")
            .replace("5918 - ", "")
            .replace("5930 - ", "")
        )

        st.markdown('<div class="table-row-wrap">', unsafe_allow_html=True)
        c = st.columns([1.05, .9, .75, 1.15, 1.4, .85, 1.15, 2.2, .52])

        with c[0]:
            st.markdown(f'<div class="cell-text"><b>{rid}</b></div>', unsafe_allow_html=True)
        with c[1]:
            st.markdown(f'<div class="cell-muted">{safe_date(row["Fecha Creación"])}</div>', unsafe_allow_html=True)
        with c[2]:
            st.markdown(f'<div class="cell-text">{hotel_short}</div>', unsafe_allow_html=True)
        with c[3]:
            st.markdown(f'<div class="cell-text">{row["Departamento"]}</div>', unsafe_allow_html=True)
        with c[4]:
            st.markdown(f'<div class="cell-text">{row["Tipo de Incidencia"]}</div>', unsafe_allow_html=True)
        with c[5]:
            st.markdown(badge(row["Prioridad"]), unsafe_allow_html=True)
        with c[6]:
            st.markdown(badge(row["Estatus"]), unsafe_allow_html=True)
        with c[7]:
            st.markdown(f'<div class="cell-text">{desc_short}</div>', unsafe_allow_html=True)
        with c[8]:
            with st.popover("⋮"):
                st.markdown('<div class="action-menu-note"><b>Acciones</b></div>', unsafe_allow_html=True)

                if st.button("✏️ Editar", key=f"edit_{rid}", use_container_width=True):
                    # Streamlit solo permite un st.dialog abierto por ejecución.
                    # Por eso limpiamos primero la bitácora antes de abrir edición.
                    st.session_state.pop("show_bitacora_id", None)
                    st.session_state["edit_id"] = rid
                    st.rerun()

                if st.button("🧾 Bitácora", key=f"bit_{rid}", use_container_width=True):
                    # Streamlit solo permite un st.dialog abierto por ejecución.
                    # Por eso limpiamos primero edición antes de abrir bitácora.
                    st.session_state.pop("edit_id", None)
                    st.session_state["show_bitacora_id"] = rid
                    st.rerun()

        st.markdown('</div>', unsafe_allow_html=True)

    st.markdown('</div>', unsafe_allow_html=True)

    # IMPORTANTE: llamar solo un diálogo por ejecución.
    if st.session_state.get("edit_id"):
        render_edit_panel(data, estados)
    elif st.session_state.get("show_bitacora_id"):
        render_bitacora_panel(data)


@st.dialog("✏️ Editar incidencia", width="large")
def render_edit_panel(data, estados):
    edit_id = st.session_state.get("edit_id")

    if not edit_id:
        return

    df = data["Pendientes"]
    hit = df[df["ID"].astype(str) == edit_id]

    if hit.empty:
        st.session_state.pop("edit_id", None)
        st.rerun()

    idx = hit.index[0]
    row = hit.iloc[0]

    st.markdown(f"**Incidencia:** `{edit_id}`")
    st.caption("Actualiza el estatus y registra el comentario de seguimiento.")

    with st.form(f"form_edit_{edit_id}"):
        c1, c2 = st.columns([.34, .66])

        with c1:
            current_status = str(row["Estatus"])
            pos = estados.index(current_status) if current_status in estados else 0
            nuevo_estatus = st.selectbox("Nuevo estatus", estados, index=pos)

        with c2:
            comentario = st.text_area(
                "Comentario de actualización",
                placeholder="Agrega el comentario de seguimiento...",
                height=110
            )

        b1, b2 = st.columns([.25, .75])

        with b1:
            guardar = st.form_submit_button("Guardar", type="primary", use_container_width=True)
        with b2:
            cancelar = st.form_submit_button("Cancelar")

        if guardar:
            anterior = str(data["Pendientes"].loc[idx, "Estatus"])
            data["Pendientes"].loc[idx, "Estatus"] = str(nuevo_estatus)
            data["Pendientes"].loc[idx, "Última Actualización"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            close_status_if_needed(data, idx, nuevo_estatus)

            accion = "Cambio de estatus" if nuevo_estatus != anterior else "Comentario"
            texto = comentario.strip() if comentario.strip() else "Actualización registrada."

            bit = pd.DataFrame(
                [[
                    edit_id,
                    datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    st.session_state.get("user", ""),
                    accion,
                    texto,
                    anterior,
                    nuevo_estatus
                ]],
                columns=BITACORA_COLUMNS
            )

            data["Bitacora"] = pd.concat([data["Bitacora"], bit], ignore_index=True)
            save_data(data)
            st.session_state.pop("edit_id", None)
            st.session_state.pop("show_bitacora_id", None)
            st.success("Incidencia actualizada correctamente.")
            clear_cache_and_rerun()

        if cancelar:
            st.session_state.pop("edit_id", None)
            st.rerun()


@st.dialog("🧾 Bitácora de incidencia", width="large")
def render_bitacora_panel(data):
    bit_id = st.session_state.get("show_bitacora_id")

    if not bit_id:
        return

    st.markdown(f"**Incidencia:** `{bit_id}`")
    st.caption("Historial de movimientos registrados para esta incidencia.")

    bit = data["Bitacora"].copy()
    bit = bit[bit["ID Pendiente"].astype(str) == bit_id].sort_values("Fecha", ascending=False)

    if bit.empty:
        st.info("Esta incidencia todavía no tiene movimientos registrados.")
    else:
        for _, b in bit.iterrows():
            st.markdown(
                f"""
                <div class="timeline-card">
                    <div style="display:flex;justify-content:space-between;gap:1rem;">
                        <div style="font-weight:900;color:#0f172a;">{b["Acción"]}</div>
                        <div style="font-size:12px;color:#64748b;">{safe_date(b["Fecha"], with_time=True)}</div>
                    </div>
                    <div style="font-size:13px;color:#475569;margin-top:8px;">{b["Comentario"]}</div>
                    <div style="font-size:12px;color:#64748b;margin-top:8px;">{b["Estado Anterior"]} → {b["Estado Nuevo"]}</div>
                    <div style="font-size:12px;color:#94a3b8;margin-top:6px;">Usuario: {b["Usuario"]}</div>
                </div>
                """,
                unsafe_allow_html=True
            )

    if st.button("Cerrar bitácora", key=f"close_bit_{bit_id}"):
        st.session_state.pop("show_bitacora_id", None)
        st.rerun()


def render_dashboard_simple_table(dff):
    """Tabla simple para el Dashboard, sin acciones de edición ni bitácora."""
    st.markdown('<div class="detail-card"><div class="detail-title">Detalle de incidencias</div>', unsafe_allow_html=True)

    if dff.empty:
        st.info("No hay incidencias con los filtros seleccionados.")
        st.markdown('</div>', unsafe_allow_html=True)
        return

    cols = [
        "ID", "Fecha Creación", "Hotel", "Departamento", "Tipo de Incidencia",
        "Prioridad", "Estatus", "Fecha Compromiso", "Descripción"
    ]

    table_df = dff[[c for c in cols if c in dff.columns]].copy()

    for col in ["Fecha Creación", "Fecha Compromiso"]:
        if col in table_df.columns:
            table_df[col] = table_df[col].apply(safe_date)

    st.dataframe(
        table_df,
        use_container_width=True,
        hide_index=True,
        height=360
    )

    st.markdown('</div>', unsafe_allow_html=True)


# ==========================================================
# DASHBOARD
# ==========================================================
def kpi_cards(df):
    total = len(df)
    en_proceso = len(df[df["Estatus"].astype(str).eq("En proceso")])
    completadas = len(df[df["Estatus"].astype(str).isin(CLOSED_STATUS)])
    pendientes = len(df[~df["Estatus"].astype(str).isin(CLOSED_STATUS)])

    vencidas = 0
    if "Fecha Compromiso" in df.columns:
        fc = pd.to_datetime(df["Fecha Compromiso"], errors="coerce")
        vencidas = int(((fc < pd.Timestamp(date.today())) & (~df["Estatus"].astype(str).isin(CLOSED_STATUS))).sum())

    vals = [
        ("Total Pendientes", total, "Todas las incidencias", "📋"),
        ("En Proceso", en_proceso, f"{(en_proceso / total * 100 if total else 0):.1f}% del total", "⏱️"),
        ("Abiertas", pendientes, f"{(pendientes / total * 100 if total else 0):.1f}% del total", "🕒"),
        ("Vencidas", vencidas, f"{(vencidas / total * 100 if total else 0):.1f}% del total", "⚠️"),
        ("Completadas", completadas, f"{(completadas / total * 100 if total else 0):.1f}% del total", "✅"),
    ]

    cols = st.columns(5)
    for col, (label, value, sub, icon) in zip(cols, vals):
        with col:
            st.markdown(
                f"""
                <div class="kpi-card">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <div class="kpi-label">{label}</div>
                        <div class="kpi-value">{value}</div>
                        <div class="kpi-sub">{sub}</div>
                    </div>
                    <div class="kpi-icon">{icon}</div>
                  </div>
                </div>
                """,
                unsafe_allow_html=True
            )


def dashboard_page(data):
    df = data["Pendientes"].copy()

    page_title("Dashboard", "Resumen ejecutivo de incidencias, estatus y comportamiento por área.")
    kpi_cards(df)

    dff = apply_filters(df, key_prefix="dash")
    render_dashboard_simple_table(dff)

    st.markdown("<br>", unsafe_allow_html=True)
    g1, g2 = st.columns(2)

    with g1:
        st.markdown('<div class="detail-card"><div class="detail-title">Incidencias por departamento</div>', unsafe_allow_html=True)
        if not dff.empty:
            chart_df = dff.groupby("Departamento").size().reset_index(name="Cantidad")
            fig = px.bar(chart_df, x="Departamento", y="Cantidad", text="Cantidad")
            fig.update_layout(
                margin=dict(l=10, r=10, t=10, b=10),
                height=310,
                paper_bgcolor="white",
                plot_bgcolor="white"
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.caption("Sin datos para graficar.")
        st.markdown('</div>', unsafe_allow_html=True)

    with g2:
        st.markdown('<div class="detail-card"><div class="detail-title">Tipos de incidencia más comunes</div>', unsafe_allow_html=True)
        if not dff.empty:
            top = (
                dff.groupby("Tipo de Incidencia")
                .size()
                .reset_index(name="Cantidad")
                .sort_values("Cantidad", ascending=False)
                .head(8)
            )
            fig = px.bar(top, x="Cantidad", y="Tipo de Incidencia", orientation="h", text="Cantidad")
            fig.update_layout(
                margin=dict(l=10, r=10, t=10, b=10),
                height=310,
                paper_bgcolor="white",
                plot_bgcolor="white"
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.caption("Sin datos para graficar.")
        st.markdown('</div>', unsafe_allow_html=True)


# ==========================================================
# PENDIENTES
# ==========================================================
def pendientes_page(data):
    create_clicked = page_title(
        "Pendientes / Incidencias",
        "Reporte operativo con filtros dinámicos, menú de acciones y bitácora por incidencia.",
        "+ Nueva incidencia",
        "btn_new_incidence"
    )

    if create_clicked:
        st.session_state["show_create"] = not st.session_state.get("show_create", False)

    if st.session_state.get("show_create", False):
        st.markdown('<div class="edit-panel">', unsafe_allow_html=True)
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
                if not normalize_text(descripcion):
                    st.error("La descripción es obligatoria.")
                else:
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

                    data["Pendientes"] = pd.concat([data["Pendientes"], new_row], ignore_index=True)

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

                    data["Bitacora"] = pd.concat([data["Bitacora"], bit], ignore_index=True)

                    save_data(data)
                    st.session_state["show_create"] = False
                    st.success("Incidencia creada correctamente.")
                    clear_cache_and_rerun()
        st.markdown('</div>', unsafe_allow_html=True)

    dff = apply_filters(data["Pendientes"].copy(), key_prefix="pend")
    render_report_table(data, dff)


# ==========================================================
# BITÁCORA GENERAL
# ==========================================================
def bitacora_page(data):
    page_title("Bitácora general", "Consulta centralizada de todos los movimientos registrados.")

    bit = data["Bitacora"].copy()
    q = st.text_input("Buscar en bitácora", placeholder="ID, usuario, comentario...")

    if q:
        mask = bit.astype(str).apply(
            lambda r: r.str.lower().str.contains(q.lower(), na=False).any(),
            axis=1
        )
        bit = bit[mask]

    st.dataframe(bit.sort_values("Fecha", ascending=False), use_container_width=True, hide_index=True)


# ==========================================================
# USUARIOS
# ==========================================================
def usuarios_page(data):
    page_title("Gestión de usuarios", "Administración de accesos, roles y estados de usuarios.")

    st.markdown('<div class="user-panel">', unsafe_allow_html=True)
    st.markdown("#### Crear usuario")

    with st.form("crear_usuario", clear_on_submit=True):
        c1, c2, c3, c4, c5 = st.columns([1, 1.2, 1, .95, .95])

        with c1:
            usuario = st.text_input("Usuario")
        with c2:
            nombre = st.text_input("Nombre")
        with c3:
            password = st.text_input("Contraseña", type="password")
        with c4:
            rol = st.selectbox("Rol", ["Administrador", "Auditor"])
        with c5:
            estado = st.selectbox("Estado", ["Activo", "Inactivo"])

        crear = st.form_submit_button("Crear usuario", type="primary")

        if crear:
            if not normalize_text(usuario) or not normalize_text(nombre) or not normalize_text(password):
                st.error("Usuario, nombre y contraseña son obligatorios.")
            else:
                users = data["Usuarios"].copy()
                if usuario in users["Usuario"].astype(str).tolist():
                    st.error("Este usuario ya existe.")
                else:
                    nuevo = pd.DataFrame(
                        [[usuario.strip(), password.strip(), nombre.strip(), rol, estado]],
                        columns=USUARIOS_COLUMNS
                    )
                    data["Usuarios"] = pd.concat([users, nuevo], ignore_index=True)
                    save_data(data)
                    st.success("Usuario creado correctamente.")
                    clear_cache_and_rerun()

    st.markdown('</div>', unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown("### Usuarios existentes")

    users = data["Usuarios"].copy()

    h1, h2, h3, h4, h5 = st.columns([1, 1.5, 1, 1, 1.15])
    with h1:
        st.markdown("**Usuario**")
    with h2:
        st.markdown("**Nombre**")
    with h3:
        st.markdown("**Rol**")
    with h4:
        st.markdown("**Estado**")
    with h5:
        st.markdown("**Acciones**")

    for idx, row in users.iterrows():
        usuario_actual = str(row["Usuario"])

        st.markdown('<div class="user-row">', unsafe_allow_html=True)
        c1, c2, c3, c4, c5 = st.columns([1, 1.5, 1, 1, 1.15])

        with c1:
            st.write(usuario_actual)
        with c2:
            st.write(row["Nombre"])
        with c3:
            st.markdown(badge(row["Rol"]), unsafe_allow_html=True)
        with c4:
            st.markdown(badge(row["Estado"]), unsafe_allow_html=True)
        with c5:
            b1, b2 = st.columns(2)

            with b1:
                if st.button("Editar", key=f"edit_user_{usuario_actual}"):
                    st.session_state["edit_user"] = usuario_actual
                    st.rerun()

            with b2:
                if usuario_actual == "admin":
                    st.button("Inactivar", key=f"inact_admin_{usuario_actual}", disabled=True)
                else:
                    if st.button("Inactivar", key=f"inact_user_{usuario_actual}"):
                        data["Usuarios"].loc[idx, "Estado"] = "Inactivo"
                        save_data(data)
                        st.success("Usuario inactivado.")
                        clear_cache_and_rerun()

        st.markdown('</div>', unsafe_allow_html=True)

    edit_user = st.session_state.get("edit_user")

    if edit_user:
        users = data["Usuarios"].copy()
        hit = users[users["Usuario"].astype(str) == edit_user]

        if not hit.empty:
            idx = hit.index[0]
            row = hit.iloc[0]

            st.markdown("<br>", unsafe_allow_html=True)
            st.markdown('<div class="edit-panel">', unsafe_allow_html=True)
            st.markdown(f"#### Editar usuario: `{edit_user}`")

            with st.form(f"form_edit_user_{edit_user}"):
                c1, c2, c3, c4 = st.columns(4)

                with c1:
                    nuevo_nombre = st.text_input("Nombre", value=str(row["Nombre"]))
                with c2:
                    nueva_password = st.text_input("Contraseña", value=str(row["Password"]), type="password")
                with c3:
                    nuevo_rol = st.selectbox(
                        "Rol",
                        ["Administrador", "Auditor"],
                        index=0 if str(row["Rol"]) == "Administrador" else 1
                    )
                with c4:
                    nuevo_estado = st.selectbox(
                        "Estado",
                        ["Activo", "Inactivo"],
                        index=0 if str(row["Estado"]) == "Activo" else 1
                    )

                guardar = st.form_submit_button("Guardar cambios", type="primary")
                cancelar = st.form_submit_button("Cancelar")

                if guardar:
                    data["Usuarios"].loc[idx, "Nombre"] = nuevo_nombre
                    data["Usuarios"].loc[idx, "Password"] = nueva_password
                    data["Usuarios"].loc[idx, "Rol"] = nuevo_rol
                    data["Usuarios"].loc[idx, "Estado"] = nuevo_estado
                    save_data(data)
                    st.session_state.pop("edit_user", None)
                    st.success("Usuario actualizado correctamente.")
                    clear_cache_and_rerun()

                if cancelar:
                    st.session_state.pop("edit_user", None)
                    st.rerun()

            st.markdown('</div>', unsafe_allow_html=True)


# ==========================================================
# CATÁLOGOS
# ==========================================================
def catalogos_page(data):
    page_title("Catálogos", "Valores disponibles para los desplegables y clasificaciones.")

    cat = data["Catalogos"].copy()

    edited = st.data_editor(
        cat,
        use_container_width=True,
        hide_index=True,
        num_rows="dynamic"
    )

    if st.button("Guardar catálogos", type="primary"):
        data["Catalogos"] = edited.fillna("")
        save_data(data)
        st.success("Catálogos actualizados.")
        clear_cache_and_rerun()


# ==========================================================
# MAIN
# ==========================================================
def main():
    try:
        data = cached_load()
    except Exception as e:
        st.error("No se pudo conectar o cargar la base de datos de Google Sheets.")
        st.exception(e)
        return

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
