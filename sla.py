from datetime import date

import pandas as pd

from constants import CLOSED_STATUS, SLA_DAYS_BY_PRIORITY
from ui_utils import normalize_text


def parse_any_date(value):
    if pd.isna(value) or value in [None, ""]:
        return pd.NaT
    return pd.to_datetime(value, errors="coerce")


def suggested_due_date(priority, created=None):
    base = parse_any_date(created)
    if pd.isna(base):
        base = pd.Timestamp(date.today())
    days = SLA_DAYS_BY_PRIORITY.get(normalize_text(priority), 3)
    return (base + pd.Timedelta(days=days)).date()


def effective_due_date(row):
    due = parse_any_date(row.get("Fecha Vencimiento Real", ""))
    if pd.isna(due):
        due = parse_any_date(row.get("Fecha Compromiso", ""))
    if pd.isna(due):
        due = pd.Timestamp(suggested_due_date(row.get("Prioridad", "Media"), row.get("Fecha Creación", "")))
    return due


def is_closed(row):
    return normalize_text(row.get("Estatus", "")) in CLOSED_STATUS


def sla_info(row):
    if is_closed(row):
        due = effective_due_date(row)
        closed = parse_any_date(row.get("Fecha Cierre", ""))
        if pd.isna(due) or pd.isna(closed):
            return {"label": "Cerrado", "class": "ok", "days": None, "met": True}
        met = closed.normalize() <= due.normalize()
        return {
            "label": "Cerrado en SLA" if met else "Cerrado fuera SLA",
            "class": "ok" if met else "overdue",
            "days": None,
            "met": met,
        }

    due = effective_due_date(row)
    today = pd.Timestamp(date.today())
    days = int((due.normalize() - today).days)

    if days < 0:
        return {"label": f"Vencido {abs(days)}d", "class": "overdue", "days": days, "met": False}
    if days == 0:
        return {"label": "Vence hoy", "class": "warning", "days": days, "met": True}
    if days <= 1:
        return {"label": f"Vence en {days}d", "class": "warning", "days": days, "met": True}
    return {"label": f"En tiempo ({days}d)", "class": "ok", "days": days, "met": True}


def sla_dashboard_category(row):
    info = sla_info(row)
    days = info.get("days")

    if is_closed(row):
        return "Cerrado en SLA" if info.get("met") else "Cerrado fuera SLA"

    if days is None:
        return "Sin fecha"
    if days < 0:
        overdue_days = abs(int(days))
        if 1 <= overdue_days <= 5:
            return "Vencido 1 a 5 días"
        if 6 <= overdue_days <= 10:
            return "Vencido 6 a 10 días"
        if 11 <= overdue_days <= 20:
            return "Vencido 11 a 20 días"
        if 21 <= overdue_days <= 30:
            return "Vencido 20 a 30 días"
        return "Vencido más de 30 días"
    if days == 0:
        return "Vence hoy"
    return "En tiempo"


def resolution_days(row):
    created = parse_any_date(row.get("Fecha Creación", ""))
    closed = parse_any_date(row.get("Fecha Cierre", ""))
    if pd.isna(created) or pd.isna(closed):
        return ""
    return max(0, int((closed.normalize() - created.normalize()).days))


def add_sla_columns(df):
    dff = df.copy()
    if dff.empty:
        dff["SLA"] = []
        dff["Días SLA"] = []
        dff["SLA Dashboard"] = []
        dff["Cumple SLA"] = []
        dff["Días Resolución"] = []
        return dff

    info = dff.apply(sla_info, axis=1)
    dff["SLA"] = info.apply(lambda item: item["label"])
    dff["Días SLA"] = info.apply(lambda item: item["days"] if item["days"] is not None else "")
    dff["Cumple SLA"] = info.apply(lambda item: "Sí" if item["met"] else "No")
    dff["SLA Dashboard"] = dff.apply(sla_dashboard_category, axis=1)
    dff["Días Resolución"] = dff.apply(resolution_days, axis=1)
    return dff


def sla_chart_data(dff_sla):
    order = [
        "Vence hoy",
        "En tiempo",
        "Cerrado en SLA",
        "Cerrado fuera SLA",
        "Vencido 1 a 5 días",
        "Vencido 6 a 10 días",
        "Vencido 11 a 20 días",
        "Vencido 20 a 30 días",
        "Vencido más de 30 días",
        "Sin fecha",
    ]
    if dff_sla.empty:
        return pd.DataFrame(columns=["SLA Dashboard", "Cantidad"])
    chart = dff_sla.groupby("SLA Dashboard").size().reset_index(name="Cantidad")
    chart["Orden"] = chart["SLA Dashboard"].apply(lambda value: order.index(value) if value in order else len(order))
    return chart.sort_values("Orden").drop(columns=["Orden"])
