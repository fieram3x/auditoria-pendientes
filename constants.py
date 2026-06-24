APP_TITLE = "Auditoría Pendientes"
SPREADSHEET_NAME = "auditoria_pendientes"

SHEET_PENDIENTES = "Pendientes"
SHEET_BITACORA = "Bitacora"
SHEET_USUARIOS = "Usuarios"
SHEET_CATALOGOS = "Catalogos"

SHEETS = [SHEET_PENDIENTES, SHEET_BITACORA, SHEET_USUARIOS, SHEET_CATALOGOS]

PENDIENTES_COLUMNS = [
    "ID",
    "Fecha Creación",
    "Hotel",
    "Departamento",
    "Área Responsable",
    "Tipo de Incidencia",
    "Impacto",
    "Prioridad",
    "Estatus",
    "Responsable",
    "Usuario asignado",
    "Creado por",
    "Última actualización por",
    "Fecha asignación",
    "Fecha Compromiso",
    "Fecha Vencimiento Real",
    "Descripción",
    "Causa raíz",
    "Acción tomada",
    "Motivo de cierre",
    "Evidencia URL",
    "Comentario final",
    "Fecha Cierre",
    "Última Actualización",
]

BITACORA_COLUMNS = [
    "ID Pendiente",
    "Fecha",
    "Usuario",
    "Acción",
    "Campo modificado",
    "Valor anterior",
    "Valor nuevo",
    "Comentario",
    "Hotel",
    "Estatus",
    "Estado Anterior",
    "Estado Nuevo",
]

USUARIOS_COLUMNS = [
    "Usuario",
    "Password",
    "Nombre",
    "Rol",
    "Estado",
    "Último acceso",
    "Intentos fallidos",
    "Bloqueado hasta",
    "Debe cambiar password",
]

CATALOGOS_COLUMNS = ["Categoria", "Valor"]

CLOSED_STATUS = ["Resuelto", "Cerrado"]
KANBAN_STATUSES = [
    "Pendiente",
    "En proceso",
    "En espera de respuesta",
    "Escalado",
    "Resuelto",
    "Cerrado",
]

PRIORITIES = ["Baja", "Media", "Alta", "Crítica"]
SLA_DAYS_BY_PRIORITY = {"Crítica": 1, "Critica": 1, "Alta": 2, "Media": 3, "Baja": 5}

ROLES = ["Administrador", "Supervisor", "Auditor"]
ADMIN_ROLE = "Administrador"
SUPERVISOR_ROLE = "Supervisor"
AUDITOR_ROLE = "Auditor"

MAX_FAILED_ATTEMPTS = 5
LOCK_MINUTES = 15

DASHBOARD_COLORS = [
    "#2563eb",
    "#16a34a",
    "#d97706",
    "#dc2626",
    "#7c3aed",
    "#0891b2",
    "#f97316",
    "#65a30d",
    "#be123c",
    "#4f46e5",
]

DEFAULT_CATALOGS = {
    "Hotel": ["5910 - PPRL", "5911 - ZEL", "5917 - MPCB", "5918 - MCB", "5930 - PGC"],
    "Departamento": [
        "Recepción",
        "Reservas",
        "A&B",
        "Spa",
        "Contabilidad",
        "IT",
        "Club Meliá",
        "Auditoría Nocturna",
        "Auditoría Diurna",
    ],
    "Área Responsable": [
        "Operaciones",
        "Finanzas",
        "Contabilidad",
        "Revenue",
        "Sistemas",
        "Auditoría",
    ],
    "Tipo de Incidencia": [
        "Cobro no realizado",
        "Routing incorrecto",
        "Check-in mal procesado",
        "Rate Code incorrecto",
        "Factura no volcada a SAP",
        "Diferencia POS vs PMS",
        "Resort Credit incorrecto",
        "HTC incorrecto",
        "Falta de soporte",
        "Incidencia IT",
    ],
    "Impacto": ["Operativo", "Financiero", "Contable", "Cliente", "Sistema"],
    "Prioridad": PRIORITIES,
    "Estatus": KANBAN_STATUSES,
    "Responsable": ["Auditoría", "Contabilidad", "IT", "Recepción", "Reservas"],
    "Causa raíz": [
        "Error operativo",
        "Falta de soporte",
        "Configuración incorrecta",
        "Proceso incompleto",
        "Incidencia de sistema",
    ],
    "Acción tomada": [
        "Corrección en PMS",
        "Corrección contable",
        "Escalamiento a IT",
        "Capacitación al equipo",
        "Validación documental",
    ],
}

COLUMN_ALIASES = {
    "Fecha CreaciÃ³n": "Fecha Creación",
    "DescripciÃ³n": "Descripción",
    "Contraseña": "Password",
    "Activo": "Estado",
    "Fecha vencimiento real": "Fecha Vencimiento Real",
    "Ultima actualizacion por": "Última actualización por",
    "Ultima Actualizacion": "Última Actualización",
    "Ultimo acceso": "Último acceso",
}
