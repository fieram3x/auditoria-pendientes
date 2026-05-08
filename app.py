import os
from io import BytesIO
from datetime import datetime, date
import pandas as pd
import streamlit as st
import plotly.express as px

APP_TITLE = "Control de Pendientes de Auditoría"
LOCAL_EXCEL = "auditoria_pendientes.xlsx"
SHEETS = ["Pendientes", "Bitacora", "Usuarios", "Catalogos"]

st.set_page_config(page_title=APP_TITLE, layout="wide")

# ---------- Estilos ----------
st.markdown("""
<style>
    .main {background-color: #F7FBFF;}
    .block-container {padding-top: 1.5rem;}
    div[data-testid="stMetric"] {background: white; padding: 16px; border-radius: 16px; box-shadow: 0 1px 4px rgba(0,0,0,.08);} 
    .stButton>button {border-radius: 10px;}
</style>
""", unsafe_allow_html=True)

# ---------- Utilidades Excel ----------
@st.cache_data(ttl=3)
def load_workbook_data():
    if not os.path.exists(LOCAL_EXCEL):
        create_empty_excel()
    data = pd.read_excel(LOCAL_EXCEL, sheet_name=None, engine="openpyxl")
    for sheet in SHEETS:
        if sheet not in data:
            data[sheet] = pd.DataFrame()
    return data


def save_workbook_data(data):
    with pd.ExcelWriter(LOCAL_EXCEL, engine="openpyxl", mode="w") as writer:
        for sheet in SHEETS:
            data.get(sheet, pd.DataFrame()).to_excel(writer, sheet_name=sheet, index=False)
    st.cache_data.clear()


def create_empty_excel():
    pendientes = pd.DataFrame(columns=[
        "ID", "Fecha Creación", "Hotel", "Departamento", "Tipo de Incidencia", "Impacto",
        "Prioridad", "Estatus", "Fecha Compromiso", "Descripción", "Comentario Inicial",
        "Fecha Cierre", "Creado Por", "Última Actualización"
    ])
    bitacora = pd.DataFrame(columns=["ID Pendiente", "Fecha", "Usuario", "Acción", "Estado Anterior", "Estado Nuevo", "Comentario"])
    usuarios = pd.DataFrame([
        {"Usuario": "admin", "Nombre": "Administrador", "Contraseña": "admin123", "Rol": "Administrador", "Estado": "Activo"},
        {"Usuario": "auditor", "Nombre": "Auditor Demo", "Contraseña": "auditor123", "Rol": "Auditor", "Estado": "Activo"},
    ])
    catalogos = pd.DataFrame({
        "Hoteles": ["5910 - PPRL", "5911 - ZEL", "5917 - MPCB", "5918 - MCB", "5930 - PGC"],
        "Departamentos": ["Recepción", "Reservas", "Spa", "A&B", "Contabilidad"],
        "Tipos de Incidencia": ["Cobro no realizado", "Routing incorrecto", "Rate Code incorrecto", "Factura no volcada", "Incidencia IT"],
        "Impactos": ["Operativo", "Financiero", "Contable", "Cliente", "Sistema"],
        "Prioridades": ["Baja", "Media", "Alta", "Crítica", ""],
        "Estatus": ["Pendiente", "En proceso", "En espera de respuesta", "Escalado", "Resuelto"],
    })
    save_workbook_data({"Pendientes": pendientes, "Bitacora": bitacora, "Usuarios": usuarios, "Catalogos": catalogos})


def list_values(df, col):
    if col not in df.columns:
        return []
    return sorted([str(x) for x in df[col].dropna().unique() if str(x).strip()])


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
        "ID Pendiente": id_pendiente,
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

# ---------- Login ----------
if "auth" not in st.session_state:
    st.session_state.auth = False
    st.session_state.user = None
    st.session_state.role = None

st.title(APP_TITLE)

data = load_workbook_data()
usuarios = data["Usuarios"]

if not st.session_state.auth:
    st.subheader("Inicio de sesión")
    with st.form("login"):
        u = st.text_input("Usuario")
        p = st.text_input("Contraseña", type="password")
        login = st.form_submit_button("Entrar")
    if login:
        match = usuarios[(usuarios["Usuario"].astype(str) == u) & (usuarios["Contraseña"].astype(str) == p) & (usuarios["Estado"].astype(str) == "Activo")]
        if not match.empty:
            st.session_state.auth = True
            st.session_state.user = u
            st.session_state.role = match.iloc[0]["Rol"]
            st.rerun()
        else:
            st.error("Usuario o contraseña incorrectos, o usuario inactivo.")
    st.info("Usuario demo: admin / admin123 | auditor / auditor123")
    st.stop()

# ---------- Sidebar ----------
st.sidebar.success(f"Usuario: {st.session_state.user} | Rol: {st.session_state.role}")
menu_items = ["Incidencias / Pendientes", "Dashboard"]
if st.session_state.role == "Administrador":
    menu_items.append("Gestión de Usuarios")
menu = st.sidebar.radio("Módulos", menu_items)
if st.sidebar.button("Cerrar sesión"):
    st.session_state.auth = False
    st.session_state.user = None
    st.session_state.role = None
    st.rerun()

pend = data["Pendientes"].copy()
cat = data["Catalogos"]

# Normalizar fechas
for col in ["Fecha Creación", "Fecha Compromiso", "Fecha Cierre", "Última Actualización"]:
    if col in pend.columns:
        pend[col] = pd.to_datetime(pend[col], errors="coerce")

hoteles = list_values(cat, "Hoteles")
departamentos = list_values(cat, "Departamentos")
tipos = list_values(cat, "Tipos de Incidencia")
impactos = list_values(cat, "Impactos")
prioridades = list_values(cat, "Prioridades")
estatuses = list_values(cat, "Estatus")

# ---------- Módulo Incidencias ----------
if menu == "Incidencias / Pendientes":
    st.header("Módulo de Incidencias / Pendientes")

    if "show_create" not in st.session_state:
        st.session_state.show_create = False
    if st.button("+ Crear pendiente"):
        st.session_state.show_create = not st.session_state.show_create

    if st.session_state.show_create:
        with st.expander("Formulario de creación", expanded=True):
            with st.form("crear_pendiente"):
                c1, c2, c3 = st.columns(3)
                hotel = c1.selectbox("Hotel", hoteles)
                departamento = c2.selectbox("Departamento", departamentos)
                tipo = c3.selectbox("Tipo de Incidencia", tipos)
                c4, c5, c6 = st.columns(3)
                impacto = c4.selectbox("Impacto", impactos)
                prioridad = c5.selectbox("Prioridad", prioridades)
                fecha_comp = c6.date_input("Fecha compromiso", value=date.today())
                titulo = st.text_input("Título / descripción corta")
                descripcion = st.text_area("Descripción")
                comentario = st.text_area("Comentario inicial")
                submitted = st.form_submit_button("Guardar pendiente")

            if submitted:
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
                    "Fecha Compromiso": pd.to_datetime(fecha_comp),
                    "Descripción": f"{titulo}\n{descripcion}".strip(),
                    "Comentario Inicial": comentario,
                    "Fecha Cierre": pd.NaT,
                    "Creado Por": st.session_state.user,
                    "Última Actualización": datetime.now(),
                }
                data["Pendientes"] = pd.concat([data["Pendientes"], pd.DataFrame([new_row])], ignore_index=True)
                add_log(data, new_id, st.session_state.user, "Creación", "", "Pendiente", comentario or descripcion or titulo)
                save_workbook_data(data)
                st.success(f"Pendiente creado: {new_id}")
                st.session_state.show_create = False
                st.rerun()

    st.subheader("Filtros")
    f1, f2, f3, f4 = st.columns(4)
    fh = f1.multiselect("Hotel", hoteles)
    fd = f2.multiselect("Departamento", departamentos)
    ft = f3.multiselect("Tipo de Incidencia", tipos)
    fe = f4.multiselect("Estatus", estatuses)
    f5, f6 = st.columns(2)
    fp = f5.multiselect("Prioridad", prioridades)
    fi = f6.text_input("Buscar texto")

    filtered = pend.copy()
    if fh: filtered = filtered[filtered["Hotel"].isin(fh)]
    if fd: filtered = filtered[filtered["Departamento"].isin(fd)]
    if ft: filtered = filtered[filtered["Tipo de Incidencia"].isin(ft)]
    if fe: filtered = filtered[filtered["Estatus"].isin(fe)]
    if fp: filtered = filtered[filtered["Prioridad"].isin(fp)]
    if fi:
        mask = filtered.astype(str).apply(lambda x: x.str.contains(fi, case=False, na=False)).any(axis=1)
        filtered = filtered[mask]

    st.download_button("Descargar filtrado en Excel", data=excel_download(filtered), file_name="pendientes_filtrados.xlsx")
    st.dataframe(filtered, use_container_width=True, hide_index=True)

    st.subheader("Actualizar estatus / Ver bitácora")
    if not filtered.empty:
        selected_id = st.selectbox("Seleccione un pendiente", filtered["ID"].astype(str).tolist())
        current = pend[pend["ID"].astype(str) == selected_id].iloc[0]
        st.write(f"**Descripción:** {current.get('Descripción', '')}")
        c1, c2 = st.columns(2)
        nuevo_estado = c1.selectbox("Nuevo estatus", estatuses, index=estatuses.index(current["Estatus"]) if current["Estatus"] in estatuses else 0)
        comentario_update = c2.text_area("Comentario de actualización")
        if st.button("Guardar actualización"):
            idx = data["Pendientes"][data["Pendientes"]["ID"].astype(str) == selected_id].index[0]
            estado_anterior = data["Pendientes"].loc[idx, "Estatus"]
            data["Pendientes"].loc[idx, "Estatus"] = nuevo_estado
            data["Pendientes"].loc[idx, "Última Actualización"] = datetime.now()
            if nuevo_estado in ["Resuelto", "Cerrado"]:
                data["Pendientes"].loc[idx, "Fecha Cierre"] = datetime.now()
            add_log(data, selected_id, st.session_state.user, "Actualización de estatus", estado_anterior, nuevo_estado, comentario_update)
            save_workbook_data(data)
            st.success("Estatus actualizado correctamente.")
            st.rerun()

        with st.expander("Ver bitácora", expanded=False):
            bit = data["Bitacora"]
            st.dataframe(bit[bit["ID Pendiente"].astype(str) == selected_id], use_container_width=True, hide_index=True)
    else:
        st.warning("No hay pendientes con esos filtros.")

# ---------- Dashboard ----------
elif menu == "Dashboard":
    st.header("Dashboard")
    if pend.empty:
        st.info("No hay datos para mostrar.")
        st.stop()

    d1, d2, d3, d4 = st.columns(4)
    dh = d1.multiselect("Hotel", hoteles, key="dash_hotel")
    dd = d2.multiselect("Departamento", departamentos, key="dash_depto")
    de = d3.multiselect("Estatus", estatuses, key="dash_status")
    dt = d4.multiselect("Tipo de Incidencia", tipos, key="dash_tipo")

    dash = pend.copy()
    if dh: dash = dash[dash["Hotel"].isin(dh)]
    if dd: dash = dash[dash["Departamento"].isin(dd)]
    if de: dash = dash[dash["Estatus"].isin(de)]
    if dt: dash = dash[dash["Tipo de Incidencia"].isin(dt)]

    today = pd.Timestamp(date.today())
    abiertos = dash[~dash["Estatus"].isin(["Resuelto", "Cerrado"])]
    vencidos = abiertos[abiertos["Fecha Compromiso"].notna() & (abiertos["Fecha Compromiso"] < today)]

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Total incidencias", len(dash))
    m2.metric("Abiertas", len(abiertos))
    m3.metric("Cerradas / Resueltas", len(dash) - len(abiertos))
    m4.metric("Vencidas", len(vencidos))

    c1, c2 = st.columns(2)
    if not dash.empty:
        fig1 = px.histogram(dash, x="Departamento", color="Estatus", title="Incidencias por departamento y estatus")
        c1.plotly_chart(fig1, use_container_width=True)
        fig2 = px.histogram(dash, x="Tipo de Incidencia", title="Tipos de incidencia más comunes")
        fig2.update_layout(xaxis_tickangle=-35)
        c2.plotly_chart(fig2, use_container_width=True)
        c3, c4 = st.columns(2)
        fig3 = px.histogram(dash, x="Hotel", color="Prioridad", title="Incidencias por hotel y prioridad")
        c3.plotly_chart(fig3, use_container_width=True)
        temp = dash.dropna(subset=["Fecha Creación"]).copy()
        if not temp.empty:
            temp["Fecha"] = temp["Fecha Creación"].dt.date
            fig4 = px.histogram(temp, x="Fecha", color="Estatus", title="Evolución por fecha")
            c4.plotly_chart(fig4, use_container_width=True)

    st.subheader("Detalle filtrado")
    st.dataframe(dash, use_container_width=True, hide_index=True)

# ---------- Usuarios ----------
elif menu == "Gestión de Usuarios":
    st.header("Gestión de Usuarios")
    st.warning("Solo administradores pueden acceder a este módulo.")
    st.dataframe(data["Usuarios"], use_container_width=True, hide_index=True)

    with st.expander("Crear usuario", expanded=False):
        with st.form("crear_usuario"):
            u = st.text_input("Usuario nuevo")
            n = st.text_input("Nombre")
            p = st.text_input("Contraseña", type="password")
            r = st.selectbox("Rol", ["Administrador", "Auditor"])
            crear = st.form_submit_button("Crear usuario")
        if crear:
            if u in data["Usuarios"]["Usuario"].astype(str).tolist():
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
        estado = st.selectbox("Estado", ["Activo", "Inactivo"])
        if st.button("Actualizar estado"):
            idx = data["Usuarios"][data["Usuarios"]["Usuario"].astype(str) == sel_user].index[0]
            data["Usuarios"].loc[idx, "Estado"] = estado
            save_workbook_data(data)
            st.success("Estado actualizado.")
            st.rerun()
