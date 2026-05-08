import os
from io import BytesIO
from datetime import datetime, date

import pandas as pd
import plotly.express as px
import streamlit as st

APP_TITLE = "Control de Pendientes de Auditoría"
LOCAL_EXCEL = "auditoria_pendientes.xlsx"
SHEETS = ["Pendientes", "Bitacora", "Usuarios", "Catalogos"]
CLOSED_STATUS = ["Resuelto", "Cerrado"]

st.set_page_config(page_title=APP_TITLE, layout="wide", initial_sidebar_state="expanded")

# -------------------- ESTILO CLARO --------------------
st.markdown(
    """
    <style>
        :root { color-scheme: light; }
        .stApp { background: #f4f8fb; color: #172033; }
        [data-testid="stSidebar"] { background: #ffffff; border-right: 1px solid #dbe5ef; }
        [data-testid="stHeader"] { background: rgba(244,248,251,.9); }
        .block-container { padding-top: 1.2rem; padding-bottom: 2rem; }
        h1, h2, h3 { color: #102a43; }
        .app-title {
            background: linear-gradient(135deg, #ffffff, #eaf6ff);
            border: 1px solid #d7e8f5;
            border-radius: 18px;
            padding: 18px 22px;
            margin-bottom: 18px;
            box-shadow: 0 6px 20px rgba(16,42,67,.06);
        }
        .app-title h1 { margin: 0; font-size: 1.65rem; }
        .app-title p { margin: 6px 0 0 0; color: #486581; }
        .metric-card, div[data-testid="stMetric"] {
            background: #ffffff;
            border: 1px solid #dbe5ef;
            border-radius: 16px;
            padding: 14px 16px;
            box-shadow: 0 5px 16px rgba(16,42,67,.06);
        }
        .incident-card {
            background: #ffffff;
            border: 1px solid #dbe5ef;
            border-left: 6px solid #2f80ed;
            border-radius: 16px;
            padding: 16px 18px;
            margin: 12px 0;
            box-shadow: 0 6px 18px rgba(16,42,67,.06);
        }
        .incident-title { font-size: 1.05rem; font-weight: 700; color: #102a43; margin-bottom: 6px; }
        .incident-meta { color: #486581; font-size: .88rem; margin-bottom: 8px; }
        .tag {
            display: inline-block;
            padding: 3px 9px;
            border-radius: 999px;
            background: #eef6ff;
            border: 1px solid #cfe8ff;
            color: #1f5f99;
            font-size: .78rem;
            margin-right: 5px;
            margin-bottom: 4px;
        }
        .tag-red { background:#fff1f0; border-color:#ffd6d1; color:#b42318; }
        .tag-orange { background:#fff7e6; border-color:#ffe2ad; color:#9a5b00; }
        .tag-green { background:#ecfdf3; border-color:#c7f0d8; color:#027a48; }
        .small-note { color:#627d98; font-size:.85rem; }
        div.stButton > button, div.stDownloadButton > button {
            border-radius: 10px;
            border: 1px solid #b7c9da;
            background: #ffffff;
            color: #102a43;
        }
        div.stButton > button:hover, div.stDownloadButton > button:hover {
            border-color: #2f80ed;
            color: #2f80ed;
        }
        .stTabs [data-baseweb="tab-list"] { gap: 8px; }
        .stTabs [data-baseweb="tab"] {
            background: #ffffff;
            border-radius: 12px;
            border: 1px solid #dbe5ef;
            padding: 10px 16px;
        }
        .stTabs [aria-selected="true"] { border-color: #2f80ed; }
    </style>
    """,
    unsafe_allow_html=True,
)

# -------------------- EXCEL --------------------
def create_empty_excel():
    pendientes = pd.DataFrame(columns=[
        "ID", "Fecha Creación", "Hotel", "Departamento", "Tipo de Incidencia", "Impacto",
        "Prioridad", "Estatus", "Fecha Compromiso", "Descripción", "Comentario Inicial",
        "Fecha Cierre", "Creado Por", "Última Actualización"
    ])
    bitacora = pd.DataFrame(columns=[
        "ID Pendiente", "Fecha", "Usuario", "Acción", "Estado Anterior", "Estado Nuevo", "Comentario"
    ])
    usuarios = pd.DataFrame([
        {"Usuario": "admin", "Nombre": "Administrador", "Contraseña": "admin123", "Rol": "Administrador", "Estado": "Activo"},
        {"Usuario": "auditor", "Nombre": "Auditor Demo", "Contraseña": "auditor123", "Rol": "Auditor", "Estado": "Activo"},
    ])
    catalogos = pd.DataFrame({
        "Hoteles": ["5910 - PPRL", "5911 - ZEL", "5917 - MPCB", "5918 - MCB", "5930 - PGC"],
        "Departamentos": ["Recepción", "Reservas", "Spa", "A&B", "Contabilidad", "IT", "Club Meliá"],
        "Tipos de Incidencia": ["Cobro no realizado", "Routing incorrecto", "Rate Code incorrecto", "Factura no volcada", "Incidencia IT", "Falta de soporte", "Error operativo"],
        "Impactos": ["Operativo", "Financiero", "Contable", "Cliente", "Sistema"],
        "Prioridades": ["Baja", "Media", "Alta", "Crítica"],
        "Estatus": ["Pendiente", "En proceso", "En espera de respuesta", "Escalado", "Resuelto", "Cerrado"],
    })
    save_workbook_data({"Pendientes": pendientes, "Bitacora": bitacora, "Usuarios": usuarios, "Catalogos": catalogos})


def ensure_columns(data):
    defaults = {
        "Pendientes": ["ID", "Fecha Creación", "Hotel", "Departamento", "Tipo de Incidencia", "Impacto", "Prioridad", "Estatus", "Fecha Compromiso", "Descripción", "Comentario Inicial", "Fecha Cierre", "Creado Por", "Última Actualización"],
        "Bitacora": ["ID Pendiente", "Fecha", "Usuario", "Acción", "Estado Anterior", "Estado Nuevo", "Comentario"],
        "Usuarios": ["Usuario", "Nombre", "Contraseña", "Rol", "Estado"],
        "Catalogos": ["Hoteles", "Departamentos", "Tipos de Incidencia", "Impactos", "Prioridades", "Estatus"],
    }
    for sheet, cols in defaults.items():
        if sheet not in data or data[sheet] is None:
            data[sheet] = pd.DataFrame(columns=cols)
        for col in cols:
            if col not in data[sheet].columns:
                data[sheet][col] = pd.NA
        data[sheet] = data[sheet][cols]

    # Evita el error de pandas al colocar datetime en columnas vacías/float.
    for col in ["Fecha Creación", "Fecha Compromiso", "Fecha Cierre", "Última Actualización"]:
        if col in data["Pendientes"].columns:
            data["Pendientes"][col] = pd.to_datetime(data["Pendientes"][col], errors="coerce").astype("object")
    if "Fecha" in data["Bitacora"].columns:
        data["Bitacora"]["Fecha"] = pd.to_datetime(data["Bitacora"]["Fecha"], errors="coerce").astype("object")
    return data


@st.cache_data(ttl=2)
def load_workbook_data():
    if not os.path.exists(LOCAL_EXCEL):
        create_empty_excel()
    data = pd.read_excel(LOCAL_EXCEL, sheet_name=None, engine="openpyxl")
    return ensure_columns(data)


def save_workbook_data(data):
    data = ensure_columns(data)
    with pd.ExcelWriter(LOCAL_EXCEL, engine="openpyxl", mode="w") as writer:
        for sheet in SHEETS:
            data.get(sheet, pd.DataFrame()).to_excel(writer, sheet_name=sheet, index=False)
    st.cache_data.clear()


def list_values(df, col):
    if col not in df.columns:
        return []
    values = [str(x).strip() for x in df[col].dropna().tolist() if str(x).strip() and str(x).strip().lower() != "nan"]
    return sorted(list(dict.fromkeys(values)))


def dynamic_values(pendientes, catalogos, field, catalog_field=None):
    vals = list_values(pendientes, field)
    if vals:
        return vals
    return list_values(catalogos, catalog_field or field)


def next_id(df):
    if df.empty or "ID" not in df.columns:
        return "INC-0001"
    nums = []
    for val in df["ID"].dropna().astype(str):
        if val.startswith("INC-"):
            try:
                nums.append(int(val.replace("INC-", "")))
            except ValueError:
                pass
    return f"INC-{(max(nums) + 1 if nums else 1):04d}"


def add_log(data, id_pendiente, usuario, accion, estado_ant, estado_nuevo, comentario):
    row = {
        "ID Pendiente": str(id_pendiente),
        "Fecha": datetime.now(),
        "Usuario": usuario,
        "Acción": accion,
        "Estado Anterior": estado_ant,
        "Estado Nuevo": estado_nuevo,
        "Comentario": comentario,
    }
    data["Bitacora"] = pd.concat([data["Bitacora"], pd.DataFrame([row])], ignore_index=True)


def excel_download(df):
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Pendientes Filtrados")
    return output.getvalue()


def fmt_date(value):
    if pd.isna(value) or value == "":
        return "-"
    try:
        return pd.to_datetime(value).strftime("%d/%m/%Y")
    except Exception:
        return str(value)


def fmt_dt(value):
    if pd.isna(value) or value == "":
        return "-"
    try:
        return pd.to_datetime(value).strftime("%d/%m/%Y %I:%M %p")
    except Exception:
        return str(value)


def priority_class(priority):
    if str(priority).lower() in ["crítica", "critica", "alta"]:
        return "tag-red"
    if str(priority).lower() == "media":
        return "tag-orange"
    return "tag-green"


def filter_data(df, filters, search_text=""):
    out = df.copy()
    for field, selected in filters.items():
        if selected and field in out.columns:
            out = out[out[field].astype(str).isin(selected)]
    if search_text:
        mask = out.astype(str).apply(lambda x: x.str.contains(search_text, case=False, na=False)).any(axis=1)
        out = out[mask]
    return out


# -------------------- LOGIN --------------------
if "auth" not in st.session_state:
    st.session_state.auth = False
    st.session_state.user = None
    st.session_state.role = None
if "show_create" not in st.session_state:
    st.session_state.show_create = False
if "log_id" not in st.session_state:
    st.session_state.log_id = None

st.markdown(
    f"""
    <div class="app-title">
        <h1>{APP_TITLE}</h1>
        <p>Seguimiento de incidencias, estatus, bitácora y dashboard gerencial.</p>
    </div>
    """,
    unsafe_allow_html=True,
)

data = load_workbook_data()
usuarios = data["Usuarios"]

if not st.session_state.auth:
    left, center, right = st.columns([1, 1.1, 1])
    with center:
        st.subheader("Inicio de sesión")
        with st.form("login"):
            u = st.text_input("Usuario")
            p = st.text_input("Contraseña", type="password")
            login = st.form_submit_button("Entrar", use_container_width=True)
        if login:
            match = usuarios[
                (usuarios["Usuario"].astype(str) == u)
                & (usuarios["Contraseña"].astype(str) == p)
                & (usuarios["Estado"].astype(str) == "Activo")
            ]
            if not match.empty:
                st.session_state.auth = True
                st.session_state.user = u
                st.session_state.role = match.iloc[0]["Rol"]
                st.rerun()
            else:
                st.error("Usuario o contraseña incorrectos, o usuario inactivo.")
        st.caption("Usuarios demo: admin/admin123 | auditor/auditor123")
    st.stop()

# -------------------- SIDEBAR --------------------
st.sidebar.markdown(f"**Usuario:** {st.session_state.user}")
st.sidebar.markdown(f"**Rol:** {st.session_state.role}")
menu_items = ["Incidencias / Pendientes", "Dashboard"]
if st.session_state.role == "Administrador":
    menu_items.append("Gestión de Usuarios")
menu = st.sidebar.radio("Módulos", menu_items)
if st.sidebar.button("Cerrar sesión", use_container_width=True):
    st.session_state.auth = False
    st.session_state.user = None
    st.session_state.role = None
    st.rerun()

pend = data["Pendientes"].copy()
cat = data["Catalogos"].copy()

# Opciones de catálogos para creación.
hoteles_cat = list_values(cat, "Hoteles") or ["5910 - PPRL", "5911 - ZEL", "5917 - MPCB", "5918 - MCB", "5930 - PGC"]
departamentos_cat = list_values(cat, "Departamentos") or ["Recepción", "Reservas", "Spa", "A&B", "Contabilidad"]
tipos_cat = list_values(cat, "Tipos de Incidencia") or ["Error operativo", "Incidencia IT"]
impactos_cat = list_values(cat, "Impactos") or ["Operativo", "Financiero", "Contable", "Cliente", "Sistema"]
prioridades_cat = list_values(cat, "Prioridades") or ["Baja", "Media", "Alta", "Crítica"]
estatuses = list_values(cat, "Estatus") or ["Pendiente", "En proceso", "En espera de respuesta", "Escalado", "Resuelto", "Cerrado"]

# Opciones dinámicas para filtros: salen de la base real de pendientes.
hoteles_filter = dynamic_values(pend, cat, "Hotel", "Hoteles")
departamentos_filter = dynamic_values(pend, cat, "Departamento", "Departamentos")
tipos_filter = dynamic_values(pend, cat, "Tipo de Incidencia", "Tipos de Incidencia")
impactos_filter = dynamic_values(pend, cat, "Impacto", "Impactos")
prioridades_filter = dynamic_values(pend, cat, "Prioridad", "Prioridades")
estatus_filter = dynamic_values(pend, cat, "Estatus", "Estatus")

# -------------------- MODAL BITÁCORA --------------------
if hasattr(st, "dialog"):
    @st.dialog("Bitácora del pendiente")
    def show_log_modal(id_pendiente):
        bit = data["Bitacora"].copy()
        bit = bit[bit["ID Pendiente"].astype(str) == str(id_pendiente)]
        if bit.empty:
            st.info("Este pendiente todavía no tiene movimientos en bitácora.")
        else:
            bit["Fecha"] = bit["Fecha"].apply(fmt_dt)
            st.dataframe(bit.sort_values("Fecha", ascending=False), use_container_width=True, hide_index=True)

# -------------------- INCIDENCIAS --------------------
if menu == "Incidencias / Pendientes":
    st.subheader("Módulo de Incidencias / Pendientes")

    top1, top2, top3, top4 = st.columns(4)
    abiertos_global = pend[~pend["Estatus"].astype(str).isin(CLOSED_STATUS)] if not pend.empty else pend
    vencidos_global = abiertos_global[
        pd.to_datetime(abiertos_global["Fecha Compromiso"], errors="coerce").notna()
        & (pd.to_datetime(abiertos_global["Fecha Compromiso"], errors="coerce") < pd.Timestamp(date.today()))
    ] if not abiertos_global.empty else abiertos_global
    top1.metric("Total", len(pend))
    top2.metric("Abiertas", len(abiertos_global))
    top3.metric("Cerradas", len(pend) - len(abiertos_global))
    top4.metric("Vencidas", len(vencidos_global))

    c_create, c_download = st.columns([1, 3])
    if c_create.button("+ Crear pendiente", use_container_width=True):
        st.session_state.show_create = not st.session_state.show_create

    if st.session_state.show_create:
        with st.container(border=True):
            st.markdown("### Crear nueva incidencia")
            with st.form("crear_pendiente", clear_on_submit=False):
                c1, c2, c3 = st.columns(3)
                hotel = c1.selectbox("Hotel", hoteles_cat)
                departamento = c2.selectbox("Departamento", departamentos_cat)
                tipo = c3.selectbox("Tipo de Incidencia", tipos_cat)
                c4, c5, c6 = st.columns(3)
                impacto = c4.selectbox("Impacto", impactos_cat)
                prioridad = c5.selectbox("Prioridad", prioridades_cat, index=prioridades_cat.index("Media") if "Media" in prioridades_cat else 0)
                fecha_comp = c6.date_input("Fecha compromiso", value=date.today())
                titulo = st.text_input("Título / descripción corta")
                descripcion = st.text_area("Descripción detallada")
                comentario = st.text_area("Comentario inicial")
                submitted = st.form_submit_button("Guardar pendiente", use_container_width=True)

            if submitted:
                if not titulo.strip() and not descripcion.strip():
                    st.error("Debes colocar al menos un título o una descripción.")
                else:
                    new_id = next_id(data["Pendientes"])
                    new_row = {
                        "ID": new_id,
                        "Fecha Creación": datetime.now(),
                        "Hotel": hotel,
                        "Departamento": departamento,
                        "Tipo de Incidencia": tipo,
                        "Impacto": impacto,
                        "Prioridad": prioridad,
                        "Estatus": "Pendiente",
                        "Fecha Compromiso": pd.Timestamp(fecha_comp),
                        "Descripción": f"{titulo}\n{descripcion}".strip(),
                        "Comentario Inicial": comentario,
                        "Fecha Cierre": pd.NaT,
                        "Creado Por": st.session_state.user,
                        "Última Actualización": datetime.now(),
                    }
                    data["Pendientes"] = pd.concat([data["Pendientes"], pd.DataFrame([new_row])], ignore_index=True)
                    add_log(data, new_id, st.session_state.user, "Creación", "", "Pendiente", comentario or descripcion or titulo)
                    save_workbook_data(data)
                    st.session_state.show_create = False
                    st.success(f"Pendiente creado: {new_id}")
                    st.rerun()

    st.markdown("### Filtros dinámicos")
    f1, f2, f3, f4 = st.columns(4)
    fh = f1.multiselect("Hotel", hoteles_filter, placeholder="Todos")
    fd = f2.multiselect("Departamento", departamentos_filter, placeholder="Todos")
    ft = f3.multiselect("Tipo de Incidencia", tipos_filter, placeholder="Todos")
    fe = f4.multiselect("Estatus", status_filter if (status_filter := estatus_filter) else estatuses, placeholder="Todos")
    f5, f6, f7 = st.columns([1, 1, 2])
    fp = f5.multiselect("Prioridad", prioridades_filter, placeholder="Todas")
    fi = f6.multiselect("Impacto", impactos_filter, placeholder="Todos")
    search = f7.text_input("Buscar", placeholder="Buscar por texto, ID, descripción...")

    filters = {
        "Hotel": fh,
        "Departamento": fd,
        "Tipo de Incidencia": ft,
        "Estatus": fe,
        "Prioridad": fp,
        "Impacto": fi,
    }
    filtered = filter_data(pend, filters, search)
    filtered = filtered.sort_values(by=["Fecha Creación"], ascending=False, na_position="last") if not filtered.empty else filtered

    st.download_button(
        "Descargar filtrado en Excel",
        data=excel_download(filtered),
        file_name="pendientes_filtrados.xlsx",
        mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        use_container_width=False,
    )

    st.markdown(f"### Lista de incidencias ({len(filtered)})")
    if filtered.empty:
        st.info("No hay pendientes con los filtros seleccionados.")
    else:
        for _, row in filtered.iterrows():
            idp = str(row.get("ID", ""))
            desc = str(row.get("Descripción", "")).strip()
            title = desc.split("\n")[0] if desc else "Sin descripción"
            estado_actual = str(row.get("Estatus", "Pendiente"))
            prioridad = str(row.get("Prioridad", ""))

            st.markdown('<div class="incident-card">', unsafe_allow_html=True)
            st.markdown(f'<div class="incident-title">{idp} · {title}</div>', unsafe_allow_html=True)
            st.markdown(
                f'<div class="incident-meta">Creado: {fmt_dt(row.get("Fecha Creación"))} · Fecha compromiso: {fmt_date(row.get("Fecha Compromiso"))} · Última actualización: {fmt_dt(row.get("Última Actualización"))}</div>',
                unsafe_allow_html=True,
            )
            st.markdown(
                f'<span class="tag">{row.get("Hotel", "-")}</span>'
                f'<span class="tag">{row.get("Departamento", "-")}</span>'
                f'<span class="tag">{row.get("Tipo de Incidencia", "-")}</span>'
                f'<span class="tag {priority_class(prioridad)}">{prioridad}</span>'
                f'<span class="tag">{estado_actual}</span>',
                unsafe_allow_html=True,
            )
            if "\n" in desc:
                with st.expander("Ver descripción completa"):
                    st.write(desc)

            col_status, col_comment, col_save, col_log = st.columns([1.2, 2.5, .9, .9])
            current_index = estatuses.index(estado_actual) if estado_actual in estatuses else 0
            nuevo_estado = col_status.selectbox("Estatus", estatuses, index=current_index, key=f"estado_{idp}", label_visibility="collapsed")
            comentario_update = col_comment.text_input("Comentario", placeholder="Comentario de actualización", key=f"coment_{idp}", label_visibility="collapsed")
            if col_save.button("Guardar", key=f"save_{idp}", use_container_width=True):
                idxs = data["Pendientes"][data["Pendientes"]["ID"].astype(str) == idp].index
                if len(idxs) == 0:
                    st.error("No se encontró el pendiente seleccionado.")
                else:
                    idx = idxs[0]
                    estado_anterior = str(data["Pendientes"].loc[idx, "Estatus"])
                    data["Pendientes"].loc[idx, "Estatus"] = nuevo_estado
                    data["Pendientes"].loc[idx, "Última Actualización"] = datetime.now()
                    if nuevo_estado in CLOSED_STATUS:
                        data["Pendientes"].loc[idx, "Fecha Cierre"] = datetime.now()
                    elif estado_anterior in CLOSED_STATUS and nuevo_estado not in CLOSED_STATUS:
                        data["Pendientes"].loc[idx, "Fecha Cierre"] = pd.NaT
                    add_log(data, idp, st.session_state.user, "Actualización de estatus", estado_anterior, nuevo_estado, comentario_update)
                    save_workbook_data(data)
                    st.success(f"{idp} actualizado correctamente.")
                    st.rerun()
            if col_log.button("Bitácora", key=f"log_{idp}", use_container_width=True):
                if hasattr(st, "dialog"):
                    show_log_modal(idp)
                else:
                    st.session_state.log_id = idp
            st.markdown("</div>", unsafe_allow_html=True)

        if st.session_state.log_id and not hasattr(st, "dialog"):
            st.markdown("### Bitácora")
            bit = data["Bitacora"].copy()
            bit = bit[bit["ID Pendiente"].astype(str) == str(st.session_state.log_id)]
            if bit.empty:
                st.info("Este pendiente todavía no tiene movimientos en bitácora.")
            else:
                bit["Fecha"] = bit["Fecha"].apply(fmt_dt)
                st.dataframe(bit, use_container_width=True, hide_index=True)

# -------------------- DASHBOARD --------------------
elif menu == "Dashboard":
    st.subheader("Dashboard")
    if pend.empty:
        st.info("No hay datos para mostrar.")
        st.stop()

    st.markdown("### Filtros dinámicos")
    d1, d2, d3, d4 = st.columns(4)
    dh = d1.multiselect("Hotel", hoteles_filter, key="dash_hotel")
    dd = d2.multiselect("Departamento", departamentos_filter, key="dash_depto")
    de = d3.multiselect("Estatus", estatus_filter, key="dash_status")
    dt = d4.multiselect("Tipo de Incidencia", tipos_filter, key="dash_tipo")
    d5, d6 = st.columns(2)
    dp = d5.multiselect("Prioridad", prioridades_filter, key="dash_prioridad")
    di = d6.multiselect("Impacto", impactos_filter, key="dash_impacto")

    dash = filter_data(pend, {
        "Hotel": dh,
        "Departamento": dd,
        "Estatus": de,
        "Tipo de Incidencia": dt,
        "Prioridad": dp,
        "Impacto": di,
    })

    today = pd.Timestamp(date.today())
    dash_dates = dash.copy()
    dash_dates["Fecha Compromiso"] = pd.to_datetime(dash_dates["Fecha Compromiso"], errors="coerce")
    abiertos = dash_dates[~dash_dates["Estatus"].astype(str).isin(CLOSED_STATUS)]
    vencidos = abiertos[abiertos["Fecha Compromiso"].notna() & (abiertos["Fecha Compromiso"] < today)]

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Total incidencias", len(dash))
    m2.metric("Abiertas", len(abiertos))
    m3.metric("Cerradas / Resueltas", len(dash) - len(abiertos))
    m4.metric("Vencidas", len(vencidos))

    if dash.empty:
        st.warning("No hay información para los filtros seleccionados.")
    else:
        c1, c2 = st.columns(2)
        fig1 = px.histogram(dash, x="Departamento", color="Estatus", title="Incidencias por departamento y estatus", text_auto=True)
        fig1.update_layout(template="plotly_white")
        c1.plotly_chart(fig1, use_container_width=True)

        fig2 = px.histogram(dash, x="Tipo de Incidencia", title="Tipos de incidencia más comunes", text_auto=True)
        fig2.update_layout(template="plotly_white", xaxis_tickangle=-30)
        c2.plotly_chart(fig2, use_container_width=True)

        c3, c4 = st.columns(2)
        fig3 = px.histogram(dash, x="Hotel", color="Prioridad", title="Incidencias por hotel y prioridad", text_auto=True)
        fig3.update_layout(template="plotly_white")
        c3.plotly_chart(fig3, use_container_width=True)

        temp = dash.copy()
        temp["Fecha Creación"] = pd.to_datetime(temp["Fecha Creación"], errors="coerce")
        temp = temp.dropna(subset=["Fecha Creación"])
        if not temp.empty:
            temp["Fecha"] = temp["Fecha Creación"].dt.date
            fig4 = px.histogram(temp, x="Fecha", color="Estatus", title="Evolución por fecha", text_auto=True)
            fig4.update_layout(template="plotly_white")
            c4.plotly_chart(fig4, use_container_width=True)

        st.markdown("### Detalle filtrado")
        preview = dash.copy()
        for col in ["Fecha Creación", "Fecha Compromiso", "Fecha Cierre", "Última Actualización"]:
            if col in preview.columns:
                preview[col] = preview[col].apply(fmt_dt if col in ["Fecha Creación", "Última Actualización"] else fmt_date)
        st.dataframe(preview, use_container_width=True, hide_index=True)

# -------------------- USUARIOS --------------------
elif menu == "Gestión de Usuarios":
    st.subheader("Gestión de Usuarios")
    st.caption("Solo administradores pueden acceder a este módulo.")
    users_view = data["Usuarios"].drop(columns=["Contraseña"], errors="ignore")
    st.dataframe(users_view, use_container_width=True, hide_index=True)

    with st.expander("Crear usuario", expanded=False):
        with st.form("crear_usuario"):
            u = st.text_input("Usuario nuevo")
            n = st.text_input("Nombre")
            p = st.text_input("Contraseña", type="password")
            r = st.selectbox("Rol", ["Administrador", "Auditor"])
            crear = st.form_submit_button("Crear usuario")
        if crear:
            if not u or not p:
                st.error("Usuario y contraseña son obligatorios.")
            elif u in data["Usuarios"]["Usuario"].astype(str).tolist():
                st.error("Ese usuario ya existe.")
            else:
                row = {"Usuario": u, "Nombre": n, "Contraseña": p, "Rol": r, "Estado": "Activo"}
                data["Usuarios"] = pd.concat([data["Usuarios"], pd.DataFrame([row])], ignore_index=True)
                save_workbook_data(data)
                st.success("Usuario creado correctamente.")
                st.rerun()

    with st.expander("Activar / desactivar usuario", expanded=False):
        users = data["Usuarios"]["Usuario"].astype(str).tolist()
        sel_user = st.selectbox("Usuario", users)
        estado_actual = data["Usuarios"].loc[data["Usuarios"]["Usuario"].astype(str) == sel_user, "Estado"].iloc[0]
        estado = st.selectbox("Estado", ["Activo", "Inactivo"], index=0 if estado_actual == "Activo" else 1)
        if st.button("Actualizar estado"):
            idx = data["Usuarios"][data["Usuarios"]["Usuario"].astype(str) == sel_user].index[0]
            data["Usuarios"].loc[idx, "Estado"] = estado
            save_workbook_data(data)
            st.success("Estado actualizado.")
            st.rerun()
