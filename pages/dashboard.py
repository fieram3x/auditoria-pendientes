from datetime import date

import pandas as pd
import plotly.express as px
import streamlit as st

from auth import has_permission
from components import alert_center, format_filter_summary, incident_filters, kpi_cards, page_title
from constants import CLOSED_STATUS, DASHBOARD_COLORS, SHEET_PENDIENTES
from exports import dashboard_pdf_bytes, filtered_excel_bytes
from sla import add_sla_columns, sla_chart_data


def _top_value(df, column, fallback="-"):
    if df.empty or column not in df.columns:
        return fallback
    values = df[column].astype(str).str.strip()
    values = values[values != ""]
    return values.value_counts().idxmax() if not values.empty else fallback


def dashboard_kpis(dff_sla):
    total = len(dff_sla)
    open_df = dff_sla[~dff_sla["Estatus"].astype(str).isin(CLOSED_STATUS)] if not dff_sla.empty else dff_sla
    closed_df = dff_sla[dff_sla["Estatus"].astype(str).isin(CLOSED_STATUS)] if not dff_sla.empty else dff_sla
    overdue = pd.to_numeric(open_df.get("Días SLA", pd.Series(dtype=float)), errors="coerce").lt(0).sum()
    critical = len(dff_sla[dff_sla["Prioridad"].astype(str).isin(["Crítica", "Critica"])]) if not dff_sla.empty else 0

    created = pd.to_datetime(dff_sla.get("Fecha Cierre", pd.Series(dtype=str)), errors="coerce")
    closed_month = len(dff_sla[created.dt.to_period("M") == pd.Timestamp(date.today()).to_period("M")]) if not dff_sla.empty else 0

    resolution = pd.to_numeric(closed_df.get("Días Resolución", pd.Series(dtype=float)), errors="coerce").dropna()
    avg_resolution = resolution.mean() if not resolution.empty else 0

    met = dff_sla.get("Cumple SLA", pd.Series(dtype=str)).astype(str).eq("Sí").sum() if not dff_sla.empty else 0
    sla_pct = (met / total * 100) if total else 0

    top_responsible = _top_value(open_df, "Responsable", "Sin asignar")
    top_department = _top_value(dff_sla, "Departamento")

    return [
        ("Total", total, "Incidencias filtradas"),
        ("Abiertas", len(open_df), f"{(len(open_df) / total * 100 if total else 0):.1f}% del total"),
        ("En proceso", len(dff_sla[dff_sla["Estatus"].astype(str).eq("En proceso")]) if total else 0, "Seguimiento activo"),
        ("Vencidas", int(overdue), "Fuera de SLA"),
        ("Críticas", critical, "Prioridad máxima"),
        ("Cerradas este mes", closed_month, "Productividad mensual"),
        ("Prom. resolución", f"{avg_resolution:.1f} días", "Solo cerradas"),
        ("% cumplimiento SLA", f"{sla_pct:.1f}%", "Filtrado actual"),
        ("Responsable con más abiertas", top_responsible, "Carga operativa"),
        ("Departamento con más incidencias", top_department, "Concentración"),
    ]


def _bar_chart(df, x, y_title="Cantidad", title=None):
    chart = df.groupby(x).size().reset_index(name="Cantidad").sort_values("Cantidad", ascending=False)
    fig = px.bar(chart, x=x, y="Cantidad", text="Cantidad", color=x, color_discrete_sequence=DASHBOARD_COLORS)
    fig.update_traces(marker_line_color="white", marker_line_width=1.2, textfont_color="#0f172a")
    fig.update_layout(
        margin=dict(l=18, r=12, t=14 if not title else 34, b=28),
        height=315,
        paper_bgcolor="white",
        plot_bgcolor="white",
        showlegend=False,
        title=title,
    )
    fig.update_xaxes(title=None, automargin=True)
    fig.update_yaxes(title=None, automargin=True, gridcolor="#e5edf7")
    return fig


def _pie_chart(df, names, title=None):
    chart = df.groupby(names).size().reset_index(name="Cantidad")
    fig = px.pie(chart, names=names, values="Cantidad", hole=.52, color_discrete_sequence=DASHBOARD_COLORS)
    fig.update_traces(textinfo="percent", textposition="inside", marker=dict(line=dict(color="white", width=4)))
    fig.update_layout(height=315, paper_bgcolor="white", margin=dict(l=8, r=8, t=14 if not title else 34, b=8), title=title)
    return fig


def _chart_card(title, fig=None, empty_message="Sin datos para graficar."):
    st.markdown(f'<div class="detail-card"><div class="kpi-label">{title}</div>', unsafe_allow_html=True)
    if fig is None:
        st.caption(empty_message)
    else:
        st.plotly_chart(fig, use_container_width=True)
    st.markdown("</div>", unsafe_allow_html=True)


def dashboard_page(data):
    page_title("Dashboard", "Resumen ejecutivo, alertas y cumplimiento SLA.")
    df = data[SHEET_PENDIENTES].copy()
    dff, filters = incident_filters(df, data=data, prefix="dash")
    dff_sla = add_sla_columns(dff)

    kpis = dashboard_kpis(dff_sla)
    kpi_cards(kpis, columns=5)
    alert_center(dff_sla)

    export_cols = st.columns([.9, .9, 3.2])
    filter_summary = format_filter_summary(filters)
    with export_cols[0]:
        st.download_button(
            "Excel filtrado",
            filtered_excel_bytes(dff_sla, filter_summary, "Dashboard filtrado"),
            "dashboard_filtrado.xlsx",
            use_container_width=True,
            disabled=not has_permission("export"),
        )
    with export_cols[1]:
        try:
            pdf_bytes = dashboard_pdf_bytes(dff_sla, kpis, filter_summary)
            st.download_button(
                "PDF ejecutivo",
                pdf_bytes,
                "dashboard_ejecutivo.pdf",
                mime="application/pdf",
                use_container_width=True,
                disabled=not has_permission("export"),
            )
        except RuntimeError as exc:
            st.caption(str(exc))

    st.markdown('<div class="detail-card"><div class="kpi-label">Detalle resumido</div>', unsafe_allow_html=True)
    detail_cols = [
        "ID",
        "Fecha Creación",
        "Hotel",
        "Departamento",
        "Prioridad",
        "Estatus",
        "Responsable",
        "SLA",
        "Fecha Compromiso",
        "Descripción",
    ]
    st.dataframe(dff_sla[[c for c in detail_cols if c in dff_sla.columns]], use_container_width=True, hide_index=True, height=320)
    st.markdown("</div>", unsafe_allow_html=True)

    g1, g2 = st.columns(2)
    with g1:
        _chart_card("Incidencias por hotel", _bar_chart(dff, "Hotel") if not dff.empty and "Hotel" in dff.columns else None)
    with g2:
        _chart_card("Incidencias por departamento", _bar_chart(dff, "Departamento") if not dff.empty and "Departamento" in dff.columns else None)

    g3, g4 = st.columns(2)
    with g3:
        _chart_card("Incidencias por prioridad", _pie_chart(dff, "Prioridad") if not dff.empty and "Prioridad" in dff.columns else None)
    with g4:
        _chart_card("Incidencias por estatus", _pie_chart(dff, "Estatus") if not dff.empty and "Estatus" in dff.columns else None)

    g5, g6 = st.columns(2)
    with g5:
        sla_data = sla_chart_data(dff_sla)
        fig = None
        if not sla_data.empty:
            fig = px.bar(sla_data, x="SLA Dashboard", y="Cantidad", text="Cantidad", color="SLA Dashboard", color_discrete_sequence=DASHBOARD_COLORS)
            fig.update_layout(height=315, margin=dict(l=18, r=12, t=12, b=48), paper_bgcolor="white", plot_bgcolor="white", showlegend=False)
            fig.update_xaxes(title=None, tickangle=-20, automargin=True)
            fig.update_yaxes(title=None, gridcolor="#e5edf7")
        _chart_card("Vencidas por rango / cumplimiento SLA", fig)

    with g6:
        fig = None
        if not dff.empty and "Fecha Creación" in dff.columns:
            trend = dff.copy()
            trend["Mes"] = pd.to_datetime(trend["Fecha Creación"], errors="coerce").dt.to_period("M").astype(str)
            trend = trend[trend["Mes"] != "NaT"].groupby("Mes").size().reset_index(name="Cantidad")
            if not trend.empty:
                fig = px.line(trend, x="Mes", y="Cantidad", markers=True)
                fig.update_layout(height=315, margin=dict(l=18, r=12, t=12, b=34), paper_bgcolor="white", plot_bgcolor="white")
                fig.update_yaxes(title=None, gridcolor="#e5edf7")
                fig.update_xaxes(title=None)
        _chart_card("Tendencia mensual", fig)
