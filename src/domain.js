export const CLOSED_STATUSES = ["Resuelto", "Cerrado"];

export const SLA_DAYS_BY_PRIORITY = {
  Crítica: 1,
  Critica: 1,
  Alta: 2,
  Media: 3,
  Baja: 5
};

export function isStrongPassword(value) {
  const password = String(value || "");
  return password.length >= 12
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9]/.test(password);
}

function dateKey(value) {
  if (!value) return "";
  const direct = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  if (direct) return direct[1];
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

export function dueDateFor(priority, createdAt = new Date()) {
  const base = new Date(createdAt);
  const days = SLA_DAYS_BY_PRIORITY[priority] ?? 3;
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

export function calculateSla(row, referenceDate = new Date()) {
  const status = String(row?.status || "").trim();
  const due = dateKey(row?.actual_due_at || row?.due_at || dueDateFor(row?.priority || "Media", row?.created_at));
  const dueDate = due ? new Date(`${due}T00:00:00`) : null;

  if (CLOSED_STATUSES.includes(status)) {
    if (!row?.closed_at || !dueDate || Number.isNaN(dueDate.getTime())) {
      return { label: "Cerrado", days: null, met: null, cls: "cerrado" };
    }
    const closed = new Date(row.closed_at);
    const met = closed <= new Date(`${due}T23:59:59`);
    return {
      label: met ? "Cerrado en SLA" : "Cerrado fuera SLA",
      days: null,
      met,
      cls: met ? "cerrado" : "vencido"
    };
  }

  if (!dueDate || Number.isNaN(dueDate.getTime())) {
    return { label: "Sin compromiso", days: null, met: null, cls: "sin-fecha" };
  }

  const today = new Date(`${dateKey(referenceDate)}T00:00:00`);
  const days = Math.ceil((dueDate - today) / 86400000);
  if (days < 0) return { label: `Vencido ${Math.abs(days)}d`, days, met: false, cls: "vencido" };
  if (days === 0) return { label: "Vence hoy", days, met: true, cls: "media" };
  if (days === 1) return { label: "Vence en 1d", days, met: true, cls: "media" };
  return { label: `En tiempo (${days}d)`, days, met: true, cls: "baja" };
}

export function dashboardMetrics(rows, referenceDate = new Date()) {
  const all = Array.isArray(rows) ? rows : [];
  const open = all.filter((row) => !CLOSED_STATUSES.includes(row.status));
  const closed = all.filter((row) => CLOSED_STATUSES.includes(row.status));
  const overdue = open.filter((row) => (calculateSla(row, referenceDate).days ?? 0) < 0);
  const dueSoon = open.filter((row) => {
    const days = calculateSla(row, referenceDate).days;
    return days !== null && days >= 0 && days <= 1;
  });
  const criticalOpen = open.filter((row) => ["Crítica", "Critica"].includes(row.priority));
  const closedInSla = closed.filter((row) => calculateSla(row, referenceDate).met === true);
  const closedOutsideSla = closed.filter((row) => calculateSla(row, referenceDate).met === false);
  const slaCompliance = closed.length ? (closedInSla.length / closed.length) * 100 : 0;

  return {
    total: all.length,
    open,
    closed,
    overdue,
    dueSoon,
    criticalOpen,
    closedInSla,
    closedOutsideSla,
    slaCompliance
  };
}

export function pageSlice(rows, page = 1, pageSize = 25) {
  const safeSize = Math.max(1, Number(pageSize) || 25);
  const totalPages = Math.max(1, Math.ceil(rows.length / safeSize));
  const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const start = (safePage - 1) * safeSize;
  return {
    rows: rows.slice(start, start + safeSize),
    page: safePage,
    pageSize: safeSize,
    totalPages,
    total: rows.length,
    start: rows.length ? start + 1 : 0,
    end: Math.min(start + safeSize, rows.length)
  };
}
