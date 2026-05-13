
# Pega este bloque en tu app.py para reemplazar la visualización actual de la tabla de pendientes.
# Uso sugerido: render_tabla_pendientes(df_filtrado)

import html
import streamlit as st

def _badge(texto, tipo="estatus"):
    texto = "" if texto is None else str(texto)
    key = texto.strip().lower()

    estilos = {
        "alta": "background:#fee2e2;color:#dc2626;border:1px solid #fecaca;",
        "crítica": "background:#ffe4e6;color:#be123c;border:1px solid #fecdd3;",
        "media": "background:#fef3c7;color:#b45309;border:1px solid #fde68a;",
        "baja": "background:#dcfce7;color:#15803d;border:1px solid #bbf7d0;",
        "pendiente": "background:#dbeafe;color:#2563eb;border:1px solid #bfdbfe;",
        "en proceso": "background:#ffedd5;color:#ea580c;border:1px solid #fed7aa;",
        "en espera de respuesta": "background:#fef9c3;color:#a16207;border:1px solid #fde68a;",
        "escalado": "background:#ede9fe;color:#7c3aed;border:1px solid #ddd6fe;",
        "resuelto": "background:#dcfce7;color:#16a34a;border:1px solid #bbf7d0;",
        "cerrado": "background:#e5e7eb;color:#374151;border:1px solid #d1d5db;",
    }

    style = estilos.get(key, "background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;")
    return f'<span class="audit-badge" style="{style}">{html.escape(texto)}</span>'

def render_tabla_pendientes(df):
    st.markdown("""
    <style>
    .audit-table-wrap{
        width:100%;
        overflow-x:auto;
        background:#ffffff;
        border:1px solid #e5edf7;
        border-radius:18px;
        box-shadow:0 12px 30px rgba(15,23,42,.06);
        padding:0;
        margin-top:20px;
    }
    .audit-table{
        width:100%;
        border-collapse:separate;
        border-spacing:0;
        font-size:13px;
        color:#0f172a;
        table-layout:fixed;
    }
    .audit-table thead th{
        background:#f8fbff;
        color:#334155;
        font-weight:800;
        text-align:left;
        padding:16px 14px;
        border-bottom:1px solid #e6eef8;
        white-space:normal;
    }
    .audit-table tbody td{
        padding:18px 14px;
        border-bottom:1px solid #eef3f8;
        vertical-align:middle;
        line-height:1.35;
        word-break:break-word;
    }
    .audit-table tbody tr:hover{
        background:#f8fbff;
    }
    .audit-table tbody tr:last-child td{
        border-bottom:none;
    }
    .audit-id{
        font-weight:800;
        color:#0f172a;
        white-space:nowrap;
    }
    .audit-date{
        color:#64748b;
        white-space:nowrap;
    }
    .audit-desc{
        font-weight:600;
        color:#0f172a;
        line-height:1.4;
    }
    .audit-badge{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        min-width:78px;
        padding:5px 10px;
        border-radius:999px;
        font-size:11px;
        font-weight:800;
        white-space:nowrap;
    }
    .audit-action{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        width:40px;
        height:34px;
        border:1px solid #dbe4ef;
        border-radius:12px;
        background:#ffffff;
        font-weight:800;
        color:#0f172a;
        box-shadow:0 2px 8px rgba(15,23,42,.04);
    }
    </style>
    """, unsafe_allow_html=True)

    filas = []
    for _, r in df.iterrows():
        filas.append(f"""
        <tr>
            <td><span class="audit-id">{html.escape(str(r.get("ID", "")))}</span></td>
            <td><span class="audit-date">{html.escape(str(r.get("Fecha Creación", r.get("Fecha", ""))))}</span></td>
            <td>{html.escape(str(r.get("Hotel", "")))}</td>
            <td>{html.escape(str(r.get("Departamento", "")))}</td>
            <td>{html.escape(str(r.get("Tipo de Incidencia", r.get("Tipo", ""))))}</td>
            <td>{_badge(r.get("Prioridad", ""))}</td>
            <td>{_badge(r.get("Estatus", ""))}</td>
            <td><div class="audit-desc">{html.escape(str(r.get("Descripción", "")))}</div></td>
            <td style="text-align:center;"><span class="audit-action">⋮⌄</span></td>
        </tr>
        """)

    tabla = f"""
    <div class="audit-table-wrap">
        <table class="audit-table">
            <colgroup>
                <col style="width:10%">
                <col style="width:9%">
                <col style="width:8%">
                <col style="width:11%">
                <col style="width:13%">
                <col style="width:9%">
                <col style="width:10%">
                <col style="width:24%">
                <col style="width:6%">
            </colgroup>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Fecha</th>
                    <th>Hotel</th>
                    <th>Departamento</th>
                    <th>Tipo</th>
                    <th>Prioridad</th>
                    <th>Estatus</th>
                    <th>Descripción</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {''.join(filas)}
            </tbody>
        </table>
    </div>
    """
    st.markdown(tabla, unsafe_allow_html=True)
