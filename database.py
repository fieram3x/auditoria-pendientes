from datetime import datetime
from uuid import uuid4

import gspread
import pandas as pd
import streamlit as st
from google.oauth2.service_account import Credentials

from constants import (
    BITACORA_COLUMNS,
    CATALOGOS_COLUMNS,
    COLUMN_ALIASES,
    DEFAULT_CATALOGS,
    PENDIENTES_COLUMNS,
    SHEET_BITACORA,
    SHEET_CATALOGOS,
    SHEET_PENDIENTES,
    SHEET_USUARIOS,
    SHEETS,
    SPREADSHEET_NAME,
    USUARIOS_COLUMNS,
)
from security import generate_temporary_password, hash_password
from ui_utils import normalize_text


def empty_df(name):
    columns = {
        SHEET_PENDIENTES: PENDIENTES_COLUMNS,
        SHEET_BITACORA: BITACORA_COLUMNS,
        SHEET_USUARIOS: USUARIOS_COLUMNS,
        SHEET_CATALOGOS: CATALOGOS_COLUMNS,
    }.get(name, CATALOGOS_COLUMNS)
    return pd.DataFrame(columns=columns)


def _yes(value):
    return normalize_text(value).lower() in {"si", "sí", "true", "1", "yes", "y"}


def seed_data(expose_initial_admin_password=False):
    initial_admin_password = st.secrets.get("initial_admin_password", None)
    if not initial_admin_password:
        initial_admin_password = generate_temporary_password()

    if expose_initial_admin_password:
        st.session_state["initial_admin_password"] = initial_admin_password

    usuarios = pd.DataFrame(
        [[
            "admin",
            hash_password(initial_admin_password),
            "Administrador",
            "Administrador",
            "Activo",
            "",
            "0",
            "",
            "Sí",
        ]],
        columns=USUARIOS_COLUMNS,
    )

    catalogos_rows = []
    for category, values in DEFAULT_CATALOGS.items():
        for value in values:
            catalogos_rows.append([category, value])

    return {
        SHEET_PENDIENTES: empty_df(SHEET_PENDIENTES),
        SHEET_BITACORA: empty_df(SHEET_BITACORA),
        SHEET_USUARIOS: usuarios,
        SHEET_CATALOGOS: pd.DataFrame(catalogos_rows, columns=CATALOGOS_COLUMNS),
    }


def conectar_google_sheets():
    scope = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
    ]
    creds = Credentials.from_service_account_info(
        st.secrets["google_service_account"],
        scopes=scope,
    )
    client = gspread.authorize(creds)
    return client.open(SPREADSHEET_NAME)


def _rename_aliases(df):
    for old, new in COLUMN_ALIASES.items():
        if old in df.columns and new not in df.columns:
            df = df.rename(columns={old: new})
    return df


def migrate_columns(df, sheet_name):
    df = _rename_aliases(df.copy())
    target = empty_df(sheet_name)

    for col in target.columns:
        if col not in df.columns:
            df[col] = ""

    df = df[list(target.columns)].fillna("")

    if sheet_name == SHEET_USUARIOS:
        df["Estado"] = df["Estado"].replace({
            "Sí": "Activo",
            "Si": "Activo",
            "No": "Inactivo",
            True: "Activo",
            False: "Inactivo",
        })
        df.loc[df["Estado"].astype(str).str.strip() == "", "Estado"] = "Activo"
        df.loc[df["Rol"].astype(str).str.strip() == "", "Rol"] = "Auditor"
        df.loc[df["Intentos fallidos"].astype(str).str.strip() == "", "Intentos fallidos"] = "0"
        df["Debe cambiar password"] = df["Debe cambiar password"].apply(
            lambda value: "Sí" if _yes(value) else "No"
        )

    if sheet_name == SHEET_PENDIENTES:
        if "Área Responsable" in df.columns:
            blank_area = df["Área Responsable"].astype(str).str.strip() == ""
            df.loc[blank_area, "Área Responsable"] = df.loc[blank_area, "Departamento"]
        if "Fecha Vencimiento Real" in df.columns:
            blank_due = df["Fecha Vencimiento Real"].astype(str).str.strip() == ""
            df.loc[blank_due, "Fecha Vencimiento Real"] = df.loc[blank_due, "Fecha Compromiso"]
        if "Usuario asignado" in df.columns:
            blank_assigned = df["Usuario asignado"].astype(str).str.strip() == ""
            df.loc[blank_assigned, "Usuario asignado"] = df.loc[blank_assigned, "Responsable"]
        if "Última actualización por" in df.columns:
            blank_updated_by = df["Última actualización por"].astype(str).str.strip() == ""
            df.loc[blank_updated_by, "Última actualización por"] = df.loc[blank_updated_by, "Creado por"]

    if sheet_name == SHEET_BITACORA:
        blank_field = df["Campo modificado"].astype(str).str.strip() == ""
        df.loc[blank_field, "Campo modificado"] = "Estatus"
        blank_old = df["Valor anterior"].astype(str).str.strip() == ""
        df.loc[blank_old, "Valor anterior"] = df.loc[blank_old, "Estado Anterior"]
        blank_new = df["Valor nuevo"].astype(str).str.strip() == ""
        df.loc[blank_new, "Valor nuevo"] = df.loc[blank_new, "Estado Nuevo"]

    return df


def load_data():
    spreadsheet = conectar_google_sheets()
    data = {}

    for sheet_name in SHEETS:
        try:
            worksheet = spreadsheet.worksheet(sheet_name)
            header = [normalize_text(value) for value in worksheet.row_values(1)]
            records = worksheet.get_all_records()
            df = pd.DataFrame(records) if records else empty_df(sheet_name)
        except Exception:
            worksheet = spreadsheet.add_worksheet(title=sheet_name, rows=1000, cols=80)
            seed = seed_data(expose_initial_admin_password=sheet_name == SHEET_USUARIOS)
            df = seed.get(sheet_name, empty_df(sheet_name))
            worksheet.update([df.columns.values.tolist()] + df.fillna("").values.tolist())
            header = list(df.columns)

        migrated = migrate_columns(df, sheet_name)
        if header != list(migrated.columns):
            worksheet.clear()
            worksheet.update([migrated.columns.values.tolist()] + migrated.fillna("").values.tolist())

        data[sheet_name] = migrated

    return data


def save_data(data, sheet_names=None):
    spreadsheet = conectar_google_sheets()
    target_sheets = sheet_names or SHEETS

    for sheet_name in target_sheets:
        df = migrate_columns(data.get(sheet_name, empty_df(sheet_name)).copy().fillna(""), sheet_name)
        worksheet = get_or_create_worksheet(spreadsheet, sheet_name)
        worksheet.clear()
        worksheet.update([df.columns.values.tolist()] + df.values.tolist())


def sheet_column_letter(col_number):
    letters = ""
    while col_number:
        col_number, remainder = divmod(col_number - 1, 26)
        letters = chr(65 + remainder) + letters
    return letters


def get_or_create_worksheet(spreadsheet, sheet_name):
    try:
        return spreadsheet.worksheet(sheet_name)
    except Exception:
        return spreadsheet.add_worksheet(title=sheet_name, rows=1000, cols=80)


def update_sheet_row(sheet_name, df, idx):
    spreadsheet = conectar_google_sheets()
    worksheet = get_or_create_worksheet(spreadsheet, sheet_name)
    clean_df = migrate_columns(df.copy().fillna(""), sheet_name)
    row_number = int(idx) + 2
    end_col = sheet_column_letter(len(clean_df.columns))
    values = [clean_df.loc[idx, clean_df.columns].tolist()]
    range_name = f"A{row_number}:{end_col}{row_number}"
    try:
        worksheet.update(values=values, range_name=range_name)
    except TypeError:
        worksheet.update(range_name, values)


def append_sheet_rows(sheet_name, rows_df):
    if rows_df is None or rows_df.empty:
        return
    spreadsheet = conectar_google_sheets()
    worksheet = get_or_create_worksheet(spreadsheet, sheet_name)
    clean_df = migrate_columns(rows_df.copy().fillna(""), sheet_name)
    worksheet.append_rows(clean_df.values.tolist(), value_input_option="USER_ENTERED")


def persist_changes(data, row_updates=None, appended_rows=None, replaced_sheets=None):
    row_updates = row_updates or []
    appended_rows = appended_rows or []
    replaced_sheets = replaced_sheets or []

    try:
        for sheet_name, idx in row_updates:
            update_sheet_row(sheet_name, data[sheet_name], idx)

        for sheet_name, rows_df in appended_rows:
            append_sheet_rows(sheet_name, rows_df)

        if replaced_sheets:
            save_data(data, replaced_sheets)
    except Exception:
        fallback_sheets = set(replaced_sheets)
        fallback_sheets.update(sheet_name for sheet_name, _ in row_updates)
        fallback_sheets.update(sheet_name for sheet_name, _ in appended_rows)
        save_data(data, sorted(fallback_sheets))


def clear_cache_and_rerun():
    st.cache_data.clear()
    st.rerun()


@st.cache_data(ttl=60)
def cached_load():
    return load_data()


def next_id():
    return f"INC-{datetime.now():%Y%m%d-%H%M%S}-{uuid4().hex[:4].upper()}"


def get_catalog(data, category, fallback=None):
    cat = data.get(SHEET_CATALOGOS, empty_df(SHEET_CATALOGOS))
    vals = cat.loc[
        cat["Categoria"].astype(str).str.strip().eq(category),
        "Valor",
    ].astype(str).str.strip().tolist()
    vals = [v for v in vals if v]
    return vals or (fallback or DEFAULT_CATALOGS.get(category, []))


def validate_catalogs(df):
    cleaned = df.copy().fillna("")
    cleaned["Categoria"] = cleaned["Categoria"].astype(str).str.strip()
    cleaned["Valor"] = cleaned["Valor"].astype(str).str.strip()
    cleaned = cleaned[(cleaned["Categoria"] != "") & (cleaned["Valor"] != "")]
    duplicate_mask = cleaned.assign(
        _cat=cleaned["Categoria"].str.lower(),
        _val=cleaned["Valor"].str.lower(),
    ).duplicated(["_cat", "_val"], keep=False)
    duplicates = cleaned.loc[duplicate_mask, ["Categoria", "Valor"]]
    return cleaned[CATALOGOS_COLUMNS], duplicates


def active_users(data):
    users = data.get(SHEET_USUARIOS, empty_df(SHEET_USUARIOS)).copy()
    if users.empty:
        return users
    return users[users["Estado"].astype(str).str.strip().eq("Activo")]


def responsible_options(data):
    catalog_values = get_catalog(data, "Responsable", [])
    users = active_users(data)
    user_values = []
    if not users.empty:
        for _, row in users.iterrows():
            name = normalize_text(row.get("Nombre", ""))
            user = normalize_text(row.get("Usuario", ""))
            if name:
                user_values.append(name)
            elif user:
                user_values.append(user)
    return sorted(dict.fromkeys([v for v in catalog_values + user_values if normalize_text(v)]))


def user_index(data, username):
    users = data.get(SHEET_USUARIOS, empty_df(SHEET_USUARIOS))
    hit = users[users["Usuario"].astype(str).eq(str(username))]
    return None if hit.empty else hit.index[0]


def bitacora_rows(pending_id, action, comment="", changes=None, row=None, user=None):
    changes = changes or [{"field": "", "old": "", "new": ""}]
    if row is None:
        row = {}
    user = user if user is not None else st.session_state.get("user", "")
    old_status = ""
    new_status = ""
    for change in changes:
        if change.get("field") == "Estatus":
            old_status = change.get("old", "")
            new_status = change.get("new", "")

    rows = []
    for change in changes:
        rows.append([
            pending_id,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            user,
            action,
            change.get("field", ""),
            change.get("old", ""),
            change.get("new", ""),
            comment,
            row.get("Hotel", "") if hasattr(row, "get") else "",
            row.get("Estatus", "") if hasattr(row, "get") else "",
            old_status,
            new_status,
        ])
    return pd.DataFrame(rows, columns=BITACORA_COLUMNS)


def audit_event(user, action, comment, success=True):
    status = "Exitoso" if success else "Fallido"
    return pd.DataFrame(
        [[
            "AUTH",
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            user,
            action,
            "Autenticación",
            "",
            status,
            comment,
            "",
            "",
            "",
            "",
        ]],
        columns=BITACORA_COLUMNS,
    )


def apply_incident_update(data, idx, updates, action, comment="", user=None):
    user = user if user is not None else st.session_state.get("user", "")
    df = data[SHEET_PENDIENTES]
    old_row = df.loc[idx].copy()
    changes = []

    for field, value in updates.items():
        if field not in df.columns:
            continue
        old = normalize_text(df.loc[idx, field])
        new = normalize_text(value)
        if old != new:
            df.loc[idx, field] = value
            changes.append({"field": field, "old": old, "new": new})

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if "Última Actualización" in df.columns:
        df.loc[idx, "Última Actualización"] = now
    if "Última actualización por" in df.columns:
        df.loc[idx, "Última actualización por"] = user

    if not changes and not normalize_text(comment):
        return pd.DataFrame(columns=BITACORA_COLUMNS), []

    new_row = df.loc[idx].copy()
    bit = bitacora_rows(
        pending_id=str(new_row.get("ID", "")),
        action=action,
        comment=comment,
        changes=changes or [{"field": "Comentario", "old": "", "new": comment}],
        row=new_row,
        user=user,
    )
    data[SHEET_BITACORA] = pd.concat([data[SHEET_BITACORA], bit], ignore_index=True)
    persist_changes(data, row_updates=[(SHEET_PENDIENTES, idx)], appended_rows=[(SHEET_BITACORA, bit)])
    return bit, changes
