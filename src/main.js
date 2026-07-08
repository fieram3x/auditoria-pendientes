import { PostgrestClient } from "@supabase/postgrest-js";
import * as XLSX from "xlsx";
import "./styles.css";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const STATUSES = ["Pendiente", "En proceso", "En espera de respuesta", "Escalado", "Resuelto", "Cerrado"];
const CLOSED = ["Resuelto", "Cerrado"];
const PRIORITIES = ["Baja", "Media", "Alta", "Crítica"];
const ROLES = ["Administrador", "Supervisor", "Auditor", "Consulta"];
const PROFILE_STATUSES = ["Activo", "Inactivo"];
const YES_NO = ["No", "Sí"];
const SLA_DAYS = { "Crítica": 1, Critica: 1, Alta: 2, Media: 3, Baja: 5 };
const INCIDENT_ID_PREFIX = "INC";
const INCIDENT_ID_WIDTH = 6;
const EMPTY_FILTER_LABEL = "(Vacíos)";
const NO_FILTER_MATCH = "__NO_FILTER_MATCH__";
const APP_SESSION_STORAGE_KEY = "auditoriaPendientes.session";
const SESSION_HEADER = "x-app-session-token";
const USER_COLUMNS = "id, username, display_name, role, status, last_access_at, failed_attempts, blocked, must_change_password, created_at, updated_at";
const PASSWORD_MASK = "********";
const CHART_COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6", "#0f766e", "#64748b"];
const CATALOG_DEFAULTS = {
  División: ["5910 - PPRL", "5911 - ZEL", "5917 - MPCB", "5918 - MCB", "5930 - PGC"],
  Departamento: ["Recepción", "Reservas", "A&B", "Spa", "Contabilidad", "IT", "Club Meliá", "Auditoría Nocturna", "Auditoría Diurna"],
  "Área Responsable": ["Operaciones", "Finanzas", "Contabilidad", "Revenue", "Sistemas", "Auditoría"],
  "Tipo de Incidencia": ["Cobro no realizado", "Routing incorrecto", "Check-in mal procesado", "Rate Code incorrecto", "Factura no volcada a SAP", "Diferencia POS vs PMS", "Resort Credit incorrecto", "HTC incorrecto", "Falta de soporte", "Incidencia IT"],
  Impacto: ["Operativo", "Financiero", "Contable", "Cliente", "Sistema"],
  Prioridad: PRIORITIES,
  Estatus: STATUSES,
  "Causa raíz": ["Error operativo", "Falta de soporte", "Configuración incorrecta", "Proceso incompleto", "Incidencia de sistema"],
  "Acción tomada": ["Corrección en PMS", "Corrección contable", "Escalamiento a IT", "Capacitación al equipo", "Validación documental"]
};

const app = document.querySelector("#app");
let supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createAppClient() : null;

const state = {
  session: null,
  profile: null,
  page: "dashboard",
  loading: true,
  incidents: [],
  audit: [],
  profiles: [],
  catalogs: [],
  openFilterMenu: "",
  filterMenuPosition: { top: 0, left: 0 },
  filters: {
    id: [],
    created_at: [],
    hotel: [],
    department: [],
    subject: [],
    impact: [],
    priority: [],
    status: [],
    type: [],
    sla: [],
    due_at: [],
    date_from: "",
    date_to: "",
    search: ""
  },
  incidentSort: {
    key: "",
    direction: ""
  },
  userFilters: {
    search: "",
    role: [],
    status: []
  }
};

function createAppClient(token = "") {
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`
  };
  if (token) {
    headers[SESSION_HEADER] = token;
  }
  return new PostgrestClient(`${SUPABASE_URL}/rest/v1`, {
    headers,
    schema: "public"
  });
}

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const normalize = (value) => String(value ?? "").trim();
const canonicalUser = (value) => normalize(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const slug = (value) => normalize(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "sin-dato";
const fmtDate = (value, withTime = false) => {
  if (!value) return "";
  const dateOnly = typeof value === "string" ? value.match(/^(\d{4})-(\d{2})-(\d{2})$/) : null;
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {})
  }).format(date);
};
const todayISO = () => new Date().toISOString().slice(0, 10);
const nowISO = () => new Date().toISOString();
const badge = (value, extra = "") => `<span class="badge ${slug(value)} ${extra}">${escapeHtml(value || "Sin dato")}</span>`;
const short = (value, max = 120) => normalize(value).length > max ? `${normalize(value).slice(0, max - 3)}...` : normalize(value);
const role = () => state.profile?.role || "Auditor";
const isAdmin = () => role() === "Administrador";
const isSupervisor = () => role() === "Supervisor";
const canManageUsers = () => isAdmin();
const canManageCatalogs = () => isAdmin() || isSupervisor();

const boolText = (value) => value ? "Sí" : "No";
const boolValue = (value) => ["si", "sí", "true", "1", "yes"].includes(canonicalUser(value));
const withPasswordMask = (row) => ({ ...row, password_mask: PASSWORD_MASK });

function readStoredSession() {
  try {
    const saved = JSON.parse(localStorage.getItem(APP_SESSION_STORAGE_KEY) || "null");
    if (!saved?.token || !saved?.expires_at) return null;
    if (new Date(saved.expires_at).getTime() <= Date.now()) {
      localStorage.removeItem(APP_SESSION_STORAGE_KEY);
      return null;
    }
    return { token: saved.token, expires_at: saved.expires_at };
  } catch {
    localStorage.removeItem(APP_SESSION_STORAGE_KEY);
    return null;
  }
}

function persistSession(session) {
  if (!session?.token) {
    localStorage.removeItem(APP_SESSION_STORAGE_KEY);
    return;
  }
  localStorage.setItem(APP_SESSION_STORAGE_KEY, JSON.stringify({
    token: session.token,
    expires_at: session.expires_at
  }));
}

function setInternalSession(session) {
  state.session = session;
  supabase = createAppClient(session?.token || "");
  persistSession(session);
}

function sessionToken() {
  return state.session?.token || "";
}

function incidentId() {
  const maxSequentialId = state.incidents.reduce((max, row) => {
    const match = normalize(row.id).match(/^INC-(\d{6})$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  const nextNumber = Math.max(maxSequentialId, state.incidents.length) + 1;
  const maxAllowed = 10 ** INCIDENT_ID_WIDTH - 1;
  if (nextNumber > maxAllowed) throw new Error("Se agotó la secuencia disponible para incidencias.");
  return `${INCIDENT_ID_PREFIX}-${String(nextNumber).padStart(INCIDENT_ID_WIDTH, "0")}`;
}

function dueDate(priority, createdAt = new Date()) {
  const base = new Date(createdAt);
  const days = SLA_DAYS[priority] ?? 3;
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

function slaInfo(row) {
  const status = normalize(row.status);
  const due = row.actual_due_at || row.due_at || dueDate(row.priority || "Media", row.created_at);
  const dueDateObj = new Date(`${due}T00:00:00`);

  if (CLOSED.includes(status)) {
    if (!row.closed_at || Number.isNaN(dueDateObj.getTime())) return { label: "Cerrado", days: null, met: true, cls: "cerrado" };
    const closed = new Date(row.closed_at);
    const met = closed <= new Date(`${due}T23:59:59`);
    return { label: met ? "Cerrado en SLA" : "Cerrado fuera SLA", days: null, met, cls: met ? "cerrado" : "vencido" };
  }

  const today = new Date(`${todayISO()}T00:00:00`);
  const days = Math.ceil((dueDateObj - today) / 86400000);
  if (days < 0) return { label: `Vencido ${Math.abs(days)}d`, days, met: false, cls: "vencido" };
  if (days === 0) return { label: "Vence hoy", days, met: true, cls: "media" };
  if (days === 1) return { label: "Vence en 1d", days, met: true, cls: "media" };
  return { label: `En tiempo (${days}d)`, days, met: true, cls: "baja" };
}

function canEditIncident(row, action = "edit") {
  if (isAdmin()) return true;
  if (isSupervisor()) return ["edit", "comment", "close", "reopen", "status"].includes(action);
  if (role() === "Consulta") return false;
  if (action === "create" || action === "comment") return true;
  if (!["edit", "status"].includes(action)) return false;
  if (!row) return false;
  const userId = state.profile?.id;
  return row.created_by === userId || row.assigned_to === userId;
}

function statusOptionsFor(row) {
  if (CLOSED.includes(row.status)) return STATUSES.filter((status) => CLOSED.includes(status) || canEditIncident(row, "reopen"));
  return STATUSES.filter((status) => !CLOSED.includes(status) || canEditIncident(row, "close"));
}

function getCatalog(category) {
  const categories = category === "División" ? ["División", "Hotel"] : [category];
  const values = state.catalogs.filter((row) => categories.includes(row.category)).map((row) => row.value).filter(Boolean);
  return values.length ? [...new Set(values)].sort() : CATALOG_DEFAULTS[category] || [];
}

function categoryLabel(category) {
  if (category === "Hotel") return "División";
  return category;
}

function optionList(values, selected = "") {
  const all = [...new Set([selected, ...values].filter(Boolean))];
  return all.map((value) => `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(value)}</option>`).join("");
}

function filterValues(value) {
  if (Array.isArray(value)) return value.map(normalize).filter(Boolean);
  const single = normalize(value);
  return single ? [single] : [];
}

function selectedFilterValues(value) {
  return filterValues(value).filter((item) => item !== NO_FILTER_MATCH);
}

function matchesFilter(selected, value) {
  const selectedValues = filterValues(selected);
  if (selectedValues.includes(NO_FILTER_MATCH)) return false;
  return !selectedValues.length || selectedValues.includes(normalize(value));
}

function matchesDateRange(value, from = "", to = "") {
  const date = dateFilterKey(value);
  return (!from || date >= from) && (!to || date <= to);
}

function multiFilterSummary(selected) {
  const values = filterValues(selected);
  if (values.includes(NO_FILTER_MATCH)) return "0 seleccionados";
  if (!values.length) return "Todos";
  if (values.length === 1) return values[0];
  return `${values.length} seleccionados`;
}

function renderMultiFilter(scope, key, label, values, selected) {
  const selectedValues = filterValues(selected);
  const options = [...new Set([...selectedValues, ...values.map(normalize)].filter(Boolean))];
  const optionAttr = scope === "users" ? "data-user-filter-option" : "data-filter-option";
  const clearAttr = scope === "users" ? "data-user-filter-clear" : "data-filter-clear";
  const menuId = `${scope}:${key}`;
  return `
    <div class="field">
      <label>${escapeHtml(label)}</label>
      <details class="multi-select" data-multi-filter-menu="${escapeHtml(menuId)}" ${state.openFilterMenu === menuId ? "open" : ""}>
        <summary><span>${escapeHtml(multiFilterSummary(selectedValues))}</span></summary>
        <div class="multi-options">
          ${selectedValues.length ? `<button type="button" class="filter-clear" ${clearAttr}="${escapeHtml(key)}">Limpiar</button>` : ""}
          ${options.map((value) => `
            <label class="multi-option">
              <input type="checkbox" ${optionAttr}="${escapeHtml(key)}" value="${escapeHtml(value)}" ${selectedValues.includes(value) ? "checked" : ""}>
              <span>${escapeHtml(value)}</span>
            </label>
          `).join("") || `<div class="empty compact-empty">Sin opciones</div>`}
        </div>
      </details>
    </div>
  `;
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2600);
}

async function requireOk(result, fallback = "No se pudo completar la operación.") {
  if (result.error) throw new Error(result.error.message || fallback);
  return result.data;
}

function isDuplicateIdError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("duplicate") || message.includes("unique") || message.includes("already exists");
}

function friendlyLoginError(error) {
  const reason = String(error?.reason || error?.message || "").toLowerCase();
  if (reason.includes("inactive")) return "Usuario inactivo. Contacte al administrador.";
  if (reason.includes("blocked")) return "Usuario bloqueado. Contacte al administrador.";
  if (reason.includes("weak_password")) return "La nueva contraseña debe tener al menos 8 caracteres.";
  return "Usuario o contraseña incorrectos.";
}

function friendlyAccessError(error) {
  const message = String(error?.message || "");
  if (message.toLowerCase().includes("sesión")) return "La sesión venció. Inicie sesión nuevamente.";
  if (message.toLowerCase().includes("inactivo")) return "Usuario inactivo. Contacte al administrador.";
  if (message.toLowerCase().includes("bloqueado")) return "Usuario bloqueado. Contacte al administrador.";
  return "No fue posible cargar el sistema. Intente nuevamente o contacte al administrador.";
}

function friendlyUserSaveError(error) {
  const message = String(error?.message || error?.reason || "").trim();
  const lower = message.toLowerCase();
  if (lower.includes("duplicate_username")) return "Ya existe un usuario con ese nombre de usuario.";
  if (lower.includes("weak_password")) return "La contraseña inicial debe tener al menos 8 caracteres.";
  if (lower.includes("legacy_user")) return "Falta actualizar la tabla audit_log en Supabase. Ejecuta el SQL actualizado y vuelve a intentar.";
  if (lower.includes("forbidden")) return "No tienes permisos para guardar usuarios.";
  return message ? `No fue posible guardar el usuario: ${message}` : "No fue posible guardar el usuario. Verifica los datos e intenta nuevamente.";
}

function clearSessionState() {
  state.session = null;
  state.profile = null;
  state.incidents = [];
  state.audit = [];
  state.profiles = [];
}

async function init() {
  if (!supabase) {
    renderConfigMissing();
    return;
  }
  const savedSession = readStoredSession();
  if (!savedSession) {
    state.loading = false;
    renderLogin();
    return;
  }
  setInternalSession(savedSession);
  try {
    await ensureProfile();
    if (state.profile?.must_change_password) {
      state.loading = false;
      renderPasswordChange();
      return;
    }
    await loadAppData();
    renderApp();
  } catch (error) {
    console.error(error);
    setInternalSession(null);
    clearSessionState();
    renderLogin(friendlyAccessError(error));
  }
}

function renderConfigMissing() {
  app.innerHTML = `
    <main class="config-shell">
      <section class="config-card">
        <div class="brand-row">
          <div class="brand-mark">🛡️</div>
          <div>
            <h1>Falta configuración</h1>
            <p class="muted">No fue posible cargar la conexión de datos.</p>
          </div>
        </div>
        <div class="error">Contacte al administrador para completar la configuración del sistema.</div>
      </section>
    </main>
  `;
}

function renderLogin(error = "") {
  app.innerHTML = `
    <main class="login-shell">
      <section class="login-card">
        <div class="brand-row">
          <div class="brand-mark">🛡️</div>
          <div>
            <h1>Auditoría Pendientes</h1>
            <p class="muted">Control y seguimiento de incidencias</p>
          </div>
        </div>
        ${error ? `<div class="error">${escapeHtml(error)}</div>` : ""}
        <form id="loginForm" class="form-grid" autocomplete="off">
          <div class="field form-full">
            <label>Usuario</label>
            <input name="login" type="text" required value="" placeholder="Inserte su usuario" autocomplete="off" autocapitalize="none" spellcheck="false">
          </div>
          <div class="field form-full">
            <label>Contraseña</label>
            <input name="password" type="password" required value="" placeholder="Inserte su contraseña" autocomplete="new-password">
          </div>
          <button class="btn primary form-full" type="submit">Entrar</button>
        </form>
      </section>
    </main>
  `;
  document.querySelector("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await loginWithUsername(form.get("login"), form.get("password"));
    } catch (error) {
      console.warn("Login failed", error);
      setInternalSession(null);
      clearSessionState();
      renderLogin(friendlyLoginError(error));
    }
  });
}

function renderPasswordChange(error = "") {
  app.innerHTML = `
    <main class="login-shell">
      <section class="login-card">
        <div class="brand-row">
          <div class="brand-mark">🛡️</div>
          <div>
            <h1>Cambiar contraseña</h1>
            <p class="muted">Actualice su contraseña para continuar.</p>
          </div>
        </div>
        ${error ? `<div class="error">${escapeHtml(error)}</div>` : ""}
        <form id="passwordChangeForm" class="form-grid" autocomplete="off">
          <div class="field form-full">
            <label>Contraseña actual</label>
            <input name="current_password" type="password" required autocomplete="current-password">
          </div>
          <div class="field form-full">
            <label>Nueva contraseña</label>
            <input name="new_password" type="password" required autocomplete="new-password">
          </div>
          <div class="field form-full">
            <label>Confirmar contraseña</label>
            <input name="confirm_password" type="password" required autocomplete="new-password">
          </div>
          <button class="btn primary form-full" type="submit">Guardar contraseña</button>
          <button class="btn ghost form-full" type="button" id="passwordLogoutBtn">Cerrar sesión</button>
        </form>
      </section>
    </main>
  `;
  document.querySelector("#passwordLogoutBtn").addEventListener("click", logout);
  document.querySelector("#passwordChangeForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextPassword = String(form.get("new_password") || "");
    if (nextPassword !== String(form.get("confirm_password") || "")) {
      renderPasswordChange("Las contraseñas no coinciden.");
      return;
    }
    try {
      await changeOwnPassword(form.get("current_password"), nextPassword);
      showToast("Contraseña actualizada.");
      await loadAppData();
      renderApp();
    } catch (changeError) {
      console.warn("Password change failed", changeError);
      renderPasswordChange(friendlyLoginError(changeError));
    }
  });
}

async function loginWithUsername(username, password) {
  const response = await requireOk(await supabase.rpc("app_login", {
    p_username: normalize(username),
    p_password: String(password || "")
  }), "No fue posible iniciar sesión.");
  if (!response?.ok) {
    const error = new Error(response?.reason || "invalid_credentials");
    error.reason = response?.reason;
    throw error;
  }
  setInternalSession({ token: response.token, expires_at: response.expires_at });
  state.profile = response.profile;
  if (response.must_change_password || response.profile?.must_change_password) {
    renderPasswordChange();
    return;
  }
  await loadAppData();
  renderApp();
}

async function changeOwnPassword(currentPassword, nextPassword) {
  const response = await requireOk(await supabase.rpc("app_change_password", {
    p_token: sessionToken(),
    p_current_password: String(currentPassword || ""),
    p_new_password: String(nextPassword || "")
  }), "No fue posible cambiar la contraseña.");
  if (!response?.ok) {
    const error = new Error(response?.reason || "invalid_credentials");
    error.reason = response?.reason;
    throw error;
  }
  state.profile = response.profile;
  setInternalSession({ token: sessionToken(), expires_at: response.expires_at || state.session?.expires_at });
}

async function logout() {
  const token = sessionToken();
  try {
    if (token) await supabase.rpc("app_logout", { p_token: token });
  } catch (error) {
    console.warn("Logout failed", error);
  }
  setInternalSession(null);
  clearSessionState();
  renderLogin();
}

async function ensureProfile() {
  if (!sessionToken()) throw new Error("Sesión inválida.");
  const response = await requireOk(await supabase.rpc("app_validate_session", {
    p_token: sessionToken()
  }), "No fue posible validar la sesión.");
  if (!response?.ok) throw new Error("Sesión inválida.");
  state.profile = response.profile;
  setInternalSession({ token: sessionToken(), expires_at: response.expires_at });
  return state.profile;
}

async function loadAppData() {
  state.loading = true;
  await ensureProfile();
  const [incidents, audit, profiles, catalogs] = await Promise.all([
    supabase.from("incidents").select("*").order("created_at", { ascending: false }),
    supabase.from("audit_log").select("*").order("occurred_at", { ascending: false }).limit(500),
    supabase.from("app_users").select(USER_COLUMNS).order("display_name"),
    supabase.from("catalogs").select("*").order("category").order("value")
  ]);
  state.incidents = await requireOk(incidents);
  state.audit = await requireOk(audit);
  state.profiles = (await requireOk(profiles)).map(withPasswordMask);
  state.catalogs = await requireOk(catalogs);
  state.loading = false;
}

function renderApp() {
  const pageMeta = {
    dashboard: { label: "Dashboard", icon: "📊" },
    incidents: { label: "Pendientes", icon: "📋" },
    kanban: { label: "Kanban", icon: "▦" },
    audit: { label: "Bitácora", icon: "🧾" },
    users: { label: "Usuarios", icon: "👥" },
    catalogs: { label: "Catálogos", icon: "⚙️" }
  };
  const pages = ["dashboard", "incidents", "kanban", "audit", ...(canManageUsers() ? ["users"] : []), ...(canManageCatalogs() ? ["catalogs"] : [])];
  app.innerHTML = `
    <div class="app-layout">
      <aside class="sidebar">
        <div class="side-title">
          <div class="brand-mark">🛡️</div>
          <div><strong>Auditoría</strong><span>Panel de control</span></div>
        </div>
        <nav class="nav">
          ${pages.map((page) => `<button data-page="${page}" class="${state.page === page ? "active" : ""}"><span>${pageMeta[page].icon}</span>${pageMeta[page].label}</button>`).join("")}
        </nav>
        <div class="sidebar-footer">
          <span>${escapeHtml(state.profile?.display_name || state.profile?.username || "Usuario")}</span>
          <span>${escapeHtml(role())}</span>
          <button class="btn ghost" id="logoutBtn">Cerrar sesión</button>
        </div>
      </aside>
      <main class="content">
        <header class="topbar">
          <div>
            <h1>Auditoría Pendientes</h1>
            <div class="muted">Sistema de gestión de incidencias de auditoría</div>
          </div>
          <div class="user-chip">${escapeHtml(state.profile?.display_name || "")} · ${escapeHtml(role())}</div>
        </header>
        <section id="page"></section>
      </main>
    </div>
    <dialog class="modal" id="modal"></dialog>
  `;
  document.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      state.page = button.dataset.page;
      renderApp();
    });
  });
  document.querySelector("#logoutBtn").addEventListener("click", logout);
  renderPage();
}

function renderPage() {
  const page = document.querySelector("#page");
  if (state.page === "dashboard") page.innerHTML = renderDashboard();
  if (state.page === "incidents") page.innerHTML = renderIncidents();
  if (state.page === "kanban") page.innerHTML = renderKanban();
  if (state.page === "audit") page.innerHTML = renderAudit();
  if (state.page === "users") page.innerHTML = renderUsers();
  if (state.page === "catalogs") page.innerHTML = renderCatalogs();
  bindPageEvents();
}

function filteredIncidents() {
  const rows = state.incidents.filter((row) => rowMatchesIncidentFilters(row));
  return sortIncidentRows(rows);
}

function rowMatchesIncidentFilters(row, { excludeKey = "" } = {}) {
  const columns = incidentColumns().filter((column) => column.filterKey);
  const f = state.filters;
  const text = [
    ...columns.map((column) => columnFilterSearchText(row, column)),
    row.description
  ].join(" ").toLowerCase();
  return columns.every((column) => column.filterKey === excludeKey || matchesFilter(f[column.filterKey], columnFilterValue(row, column)))
    && matchesFilter(f.impact, row.impact)
    && matchesDateRange(row.created_at, f.date_from, f.date_to)
    && (!f.search || text.includes(f.search.toLowerCase()));
}

function sortIncidentRows(rows) {
  const { key, direction } = state.incidentSort;
  if (!key || !direction) return rows;
  const priorityRank = new Map(PRIORITIES.map((value, index) => [value, index]));
  const statusRank = new Map(STATUSES.map((value, index) => [value, index]));
  const valueForSort = (row) => {
    if (key === "sla") return slaInfo(row).days ?? 999;
    if (key === "priority") return priorityRank.get(row.priority) ?? 999;
    if (key === "status") return statusRank.get(row.status) ?? 999;
    if (key === "created_at" || key === "due_at") return new Date(row[key] || 0).getTime() || 0;
    return canonicalUser(row[key]);
  };
  return [...rows].sort((a, b) => {
    const first = valueForSort(a);
    const second = valueForSort(b);
    const result = typeof first === "number" && typeof second === "number"
      ? first - second
      : String(first).localeCompare(String(second), "es", { numeric: true, sensitivity: "base" });
    return direction === "desc" ? result * -1 : result;
  });
}

function pageHead(title, subtitle, action = "") {
  return `
    <div class="page-head">
      <div><h2>${escapeHtml(title)}</h2><div class="muted">${escapeHtml(subtitle)}</div></div>
      ${action}
    </div>
  `;
}

function renderFilters({ compact = false, sticky = false } = {}) {
  const f = state.filters;
  const classes = ["filters", "dashboard-filters", compact ? "compact-filters" : "", sticky ? "sticky-filters" : ""].filter(Boolean).join(" ");
  return `
    <div class="${classes}">
      ${renderMultiFilter("incidents", "hotel", "División", getDistinct("hotel"), f.hotel)}
      ${renderMultiFilter("incidents", "department", "Departamento", getDistinct("department"), f.department)}
      ${renderMultiFilter("incidents", "impact", "Impacto", getDistinct("impact"), f.impact)}
      ${renderMultiFilter("incidents", "priority", "Prioridad", PRIORITIES, f.priority)}
      ${renderMultiFilter("incidents", "status", "Estatus", STATUSES, f.status)}
      <div class="field"><label>Fecha desde</label><input data-filter="date_from" type="date" value="${escapeHtml(f.date_from)}"></div>
      <div class="field"><label>Fecha hasta</label><input data-filter="date_to" type="date" value="${escapeHtml(f.date_to)}"></div>
      <div class="field"><label>Buscar</label><input data-filter="search" value="${escapeHtml(f.search)}" placeholder="ID, asunto, descripción..."></div>
    </div>
  `;
}

function renderKanbanFilters() {
  const f = state.filters;
  return `
    <div class="filters compact-filters kanban-filters">
      ${kanbanSelectFilter("hotel", "División", getDistinct("hotel"), f.hotel)}
      ${kanbanSelectFilter("department", "Departamento", getDistinct("department"), f.department)}
      ${kanbanSelectFilter("impact", "Impacto", getDistinct("impact"), f.impact)}
      ${kanbanSelectFilter("priority", "Prioridad", PRIORITIES, f.priority)}
      ${kanbanSelectFilter("status", "Estatus", STATUSES, f.status)}
      <div class="field"><label>Buscar</label><input data-filter="search" value="${escapeHtml(f.search)}" placeholder="ID, asunto, descripción..."></div>
    </div>
  `;
}

function kanbanSelectFilter(key, label, values, selected) {
  const selectedValues = selectedFilterValues(selected);
  const selectedValue = selectedValues.length === 1 ? selectedValues[0] : "";
  const specialLabel = filterValues(selected).includes(NO_FILTER_MATCH)
    ? "0 seleccionados"
    : selectedValues.length > 1 ? `${selectedValues.length} seleccionados` : "";
  const options = [...new Set([selectedValue, ...values.map(normalize)].filter(Boolean))];
  return `
    <div class="field">
      <label>${escapeHtml(label)}</label>
      <select data-filter="${escapeHtml(key)}">
        <option value="">Todos</option>
        ${specialLabel ? `<option value="" selected disabled>${escapeHtml(specialLabel)}</option>` : ""}
        ${options.map((value) => `<option value="${escapeHtml(value)}" ${value === selectedValue && !specialLabel ? "selected" : ""}>${escapeHtml(value)}</option>`).join("")}
      </select>
    </div>
  `;
}

function getDistinct(field) {
  return [...new Set(state.incidents.map((row) => normalize(row[field])).filter(Boolean))].sort();
}

function renderDashboard() {
  const rows = filteredIncidents();
  const open = rows.filter((row) => !CLOSED.includes(row.status));
  const closed = rows.filter((row) => CLOSED.includes(row.status));
  const overdue = open.filter((row) => slaInfo(row).days < 0);
  const critical = rows.filter((row) => ["Crítica", "Critica"].includes(row.priority));
  const closedMonth = closed.filter((row) => fmtDate(row.closed_at).slice(3) === fmtDate(new Date()).slice(3));
  const slaMet = rows.filter((row) => slaInfo(row).met).length;
  const topDepartment = topValue(rows, "department") || "-";
  return `
    ${pageHead("Dashboard", "Indicadores ejecutivos y comportamiento operativo.")}
    ${renderFilters()}
    <div class="kpi-grid">
      ${kpi("Total", rows.length, "Incidencias filtradas")}
      ${kpi("Abiertas", open.length, `${pct(open.length, rows.length)}% del total`)}
      ${kpi("Vencidas", overdue.length, "Fuera de SLA")}
      ${kpi("Críticas", critical.length, "Prioridad máxima")}
      ${kpi("Cerradas este mes", closedMonth.length, "Productividad mensual")}
      ${kpi("% Cumplimiento SLA", `${pct(slaMet, rows.length)}%`, "Filtrado actual")}
      ${kpi("Departamento con más incidencias", topDepartment, "Concentración")}
    </div>
    <div class="dashboard-visuals">
      ${trendPanel("Tendencia mensual", rows)}
      ${donutPanel("Cumplimiento SLA", slaMet, rows.length, "En SLA", "Fuera SLA", "#16a34a")}
      ${barPanel("Incidencias por departamento", rows, "department")}
    </div>
  `;
}

function kpi(label, value, sub) {
  return `<div class="kpi"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(value)}</div><div class="sub">${escapeHtml(sub)}</div></div>`;
}

function pct(part, total) {
  return total ? ((part / total) * 100).toFixed(1) : "0.0";
}

function topValue(rows, key) {
  const counts = new Map();
  rows.forEach((row) => {
    const value = normalize(row[key]) || "Sin asignar";
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

function countBy(rows, key, labels = []) {
  const counts = new Map();
  rows.forEach((row) => {
    const value = normalize(row[key]) || "Sin dato";
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  if (labels.length) return labels.map((label) => [label, counts.get(label) || 0]);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function monthKey(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function recentMonths(count = 6) {
  const formatter = new Intl.DateTimeFormat("es-DO", { month: "short" });
  return [...Array(count)].map((_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (count - index - 1));
    return {
      key: monthKey(date),
      label: formatter.format(date).replace(".", "")
    };
  });
}

function trendPanel(title, rows) {
  const months = recentMonths(6);
  const values = months.map((month) => rows.filter((row) => monthKey(row.created_at) === month.key).length);
  const max = Math.max(1, ...values);
  const width = 360;
  const height = 170;
  const left = 34;
  const bottom = 138;
  const chartWidth = 292;
  const chartHeight = 92;
  const step = values.length > 1 ? chartWidth / (values.length - 1) : chartWidth;
  const points = values.map((value, index) => {
    const x = left + index * step;
    const y = bottom - (value / max) * chartHeight;
    return [x, y];
  });
  const path = points.map(([x, y], index) => `${index ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${path} L ${points.at(-1)?.[0].toFixed(1) || left} ${bottom} L ${left} ${bottom} Z`;
  return `
    <section class="panel chart-panel chart-wide">
      <div class="chart-head">
        <h3>${escapeHtml(title)}</h3>
        <span>${escapeHtml(rows.length)} total</span>
      </div>
      <svg class="line-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(title)}">
        <path class="line-area" d="${area}"></path>
        <path class="line-path" d="${path}"></path>
        ${[0, 0.5, 1].map((ratio) => {
          const y = bottom - ratio * chartHeight;
          return `<line class="grid-line" x1="${left}" x2="${left + chartWidth}" y1="${y}" y2="${y}"></line>`;
        }).join("")}
        ${points.map(([x, y], index) => `
          <circle class="line-point" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4"></circle>
          <text class="line-value" x="${x.toFixed(1)}" y="${(y - 10).toFixed(1)}">${values[index]}</text>
          <text class="line-label" x="${x.toFixed(1)}" y="158">${escapeHtml(months[index].label)}</text>
        `).join("")}
      </svg>
    </section>
  `;
}

function donutPanel(title, value, total, positiveLabel, negativeLabel, color) {
  const percent = Number(pct(value, total));
  const remaining = Math.max(0, total - value);
  return `
    <section class="panel chart-panel donut-panel">
      <div class="chart-head">
        <h3>${escapeHtml(title)}</h3>
        <span>${escapeHtml(total)} total</span>
      </div>
      <div class="donut-wrap">
        <div class="donut" style="--pct:${percent};--donut-color:${color};"><span>${percent.toFixed(1)}%</span></div>
        <div class="donut-legend">
          <span><b style="background:${color};"></b>${escapeHtml(positiveLabel)}: ${escapeHtml(value)}</span>
          <span><b></b>${escapeHtml(negativeLabel)}: ${escapeHtml(remaining)}</span>
        </div>
      </div>
    </section>
  `;
}

function statusPanel(rows) {
  const items = countBy(rows, "status", STATUSES);
  const total = Math.max(1, rows.length);
  return `
    <section class="panel chart-panel">
      <div class="chart-head">
        <h3>Distribución por estatus</h3>
        <span>${escapeHtml(rows.length)} total</span>
      </div>
      <div class="status-stack">
        ${items.map(([label, value], index) => `
          <span title="${escapeHtml(label)}: ${escapeHtml(value)}" style="width:${(value / total) * 100}%;background:${CHART_COLORS[index % CHART_COLORS.length]};"></span>
        `).join("")}
      </div>
      <div class="status-list">
        ${items.map(([label, value], index) => `
          <div>
            <span><b style="background:${CHART_COLORS[index % CHART_COLORS.length]};"></b>${escapeHtml(label)}</span>
            <strong>${escapeHtml(value)}</strong>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function priorityPanel(rows) {
  const items = countBy(rows, "priority", PRIORITIES);
  const max = Math.max(1, ...items.map(([, value]) => value));
  return `
    <section class="panel chart-panel">
      <div class="chart-head">
        <h3>Prioridad</h3>
        <span>Volumen por nivel</span>
      </div>
      <div class="vertical-chart">
        ${items.map(([label, value], index) => `
          <div class="vertical-item">
            <span>${escapeHtml(value)}</span>
            <div class="vertical-track">
              <div class="vertical-fill" style="height:${(value / max) * 100}%;background:${CHART_COLORS[index % CHART_COLORS.length]};"></div>
            </div>
            <b>${escapeHtml(label)}</b>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function barPanel(title, rows, key) {
  const counts = new Map();
  rows.forEach((row) => {
    const value = normalize(row[key]) || "Sin dato";
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  const max = Math.max(1, ...counts.values());
  const items = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  return `
    <section class="panel">
      <h3>${escapeHtml(title)}</h3>
      ${items.length ? items.map(([label, value]) => `
        <div class="bar-row">
          <span>${escapeHtml(label)}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${(value / max) * 100}%"></div></div>
          <b>${value}</b>
        </div>
      `).join("") : `<div class="empty">Sin datos</div>`}
    </section>
  `;
}

function renderIncidents() {
  const rows = filteredIncidents();
  const createAction = canEditIncident(null, "create") ? `<button class="btn primary" data-action="new-incident">Nueva incidencia</button>` : "";
  return `
    ${pageHead("Incidencias", "Tabla tipo Excel, filtros, acciones y cierre formal.", createAction)}
    <div class="toolbar table-toolbar">
      <strong>${rows.length} registro(s)</strong>
      <div class="toolbar-actions">
        <div class="field toolbar-search">
          <label>Buscar</label>
          <input data-filter="search" value="${escapeHtml(state.filters.search)}" placeholder="ID, asunto, descripción...">
        </div>
        <button class="btn" data-action="export-excel">Exportar Excel</button>
      </div>
    </div>
    ${excelTable(rows)}
  `;
}

function incidentColumns() {
  return [
    { key: "actions", label: "Abrir" },
    { key: "id", label: "ID", filterKey: "id", sortKey: "id" },
    { key: "created_at", label: "Fecha", filterKey: "created_at", sortKey: "created_at", type: "date" },
    { key: "hotel", label: "División", filterKey: "hotel", sortKey: "hotel" },
    { key: "department", label: "Departamento", filterKey: "department", sortKey: "department" },
    { key: "subject", label: "Asunto", filterKey: "subject", sortKey: "subject" },
    { key: "incident_type", label: "Tipo", filterKey: "type", sortKey: "incident_type" },
    { key: "priority", label: "Prioridad", filterKey: "priority", sortKey: "priority" },
    { key: "status", label: "Estatus", filterKey: "status", sortKey: "status" },
    { key: "sla", label: "SLA", filterKey: "sla", sortKey: "sla" },
    { key: "due_at", label: "Compromiso", filterKey: "due_at", sortKey: "due_at", type: "date" }
  ];
}

function excelTable(rows) {
  const columns = incidentColumns();
  return `
    <div class="excel-wrap">
      <div class="excel-scroller">
        <table class="excel">
          <thead><tr>${columns.map((column) => `<th>${renderTableHeader(column)}</th>`).join("")}</tr></thead>
          <tbody>
            ${rows.length ? rows.map((row) => `
              <tr>
                ${columns.map(({ key }) => `<td>${cellValue(row, key)}</td>`).join("")}
              </tr>
            `).join("") : `<tr><td colspan="${columns.length}" class="empty">No hay incidencias con los filtros seleccionados.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
    ${renderOpenColumnFilterMenu(columns)}
  `;
}

function filterDisplayValue(value) {
  const normalized = normalize(value);
  return normalized || EMPTY_FILTER_LABEL;
}

function dateFilterKey(value) {
  const normalized = normalize(value);
  const isoDate = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;
  const localDate = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (localDate) return `${localDate[3]}-${localDate[2]}-${localDate[1]}`;
  const parsed = normalized ? new Date(normalized) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : "";
}

function dateFilterLabel(value) {
  if (value === EMPTY_FILTER_LABEL) return value;
  return fmtDate(value);
}

function columnFilterValue(row, column) {
  if (column.type === "date") return filterDisplayValue(dateFilterKey(row[column.key]));
  if (column.key === "sla") return filterDisplayValue(slaInfo(row).label);
  return filterDisplayValue(row[column.key]);
}

function columnFilterSearchText(row, column) {
  const value = columnFilterValue(row, column);
  return column.type === "date" ? `${value} ${dateFilterLabel(value)}` : value;
}

function columnFilterValues(column) {
  const rows = state.incidents.filter((row) => rowMatchesIncidentFilters(row, { excludeKey: column.filterKey }));
  const values = rows.map((row) => columnFilterValue(row, column));
  return [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), "es", { numeric: true, sensitivity: "base" }));
}

function columnOptionLabel(value, column) {
  return column.type === "date" ? dateFilterLabel(value) : value;
}

function cellValue(row, key) {
  if (key === "id") return escapeHtml(row.id);
  if (key === "actions") return `<button class="btn tiny" data-action="open-incident" data-id="${escapeHtml(row.id)}">Abrir</button>`;
  if (key === "created_at" || key === "due_at") return escapeHtml(fmtDate(row[key]));
  if (key === "priority") return badge(row.priority);
  if (key === "status") return badge(row.status);
  if (key === "sla") {
    const info = slaInfo(row);
    return badge(info.label, info.cls);
  }
  if (key === "subject") return escapeHtml(short(row.subject, 90));
  if (key === "description") return escapeHtml(short(row.description, 130));
  return escapeHtml(row[key] || "");
}

function renderKanban() {
  const rows = filteredIncidents();
  return `
    <div class="kanban-page">
      ${pageHead("Kanban", "Seguimiento por estatus con cambio rápido.")}
      ${renderKanbanFilters()}
      <div class="kanban-board-scroll">
        <div class="kanban">
          ${STATUSES.map((status) => {
            const group = rows.filter((row) => row.status === status);
            return `
              <section class="kanban-col ${slug(status)}">
                <div class="kanban-head">
                  <span>${escapeHtml(status)}</span>
                  <b>${group.length}</b>
                </div>
                <div class="kanban-list">
                  ${group.map((row) => `
                    <article class="kanban-card">
                      <div class="kanban-card-top">
                        <button class="row-button" data-action="open-incident" data-id="${escapeHtml(row.id)}">${escapeHtml(row.id)}</button>
                        ${badge(row.priority)}
                      </div>
                      <div class="kanban-card-meta">${escapeHtml(row.hotel || "Sin división")} · ${escapeHtml(row.department || "Sin departamento")}</div>
                      <strong class="kanban-card-title">${escapeHtml(short(row.subject || row.description || "Sin asunto", 85))}</strong>
                      <div class="kanban-card-footer">
                        ${badge(slaInfo(row).label, slaInfo(row).cls)}
                        <select data-status-change="${escapeHtml(row.id)}" ${!canEditIncident(row, "status") && !canEditIncident(row, "reopen") ? "disabled" : ""}>
                          ${optionList(statusOptionsFor(row), row.status)}
                        </select>
                      </div>
                    </article>
                  `).join("") || `<div class="empty kanban-empty">Sin incidencias.</div>`}
                </div>
              </section>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderAudit() {
  return `
    ${pageHead("Bitácora", "Historial completo de cambios y comentarios.")}
    <div class="excel-wrap">
      <div class="excel-scroller">
        <table class="excel">
          <thead><tr><th>Fecha</th><th>Usuario</th><th>Incidencia</th><th>Acción</th><th>Campo</th><th>Anterior</th><th>Nuevo</th><th>Comentario</th></tr></thead>
          <tbody>
            ${state.audit.map((row) => `
              <tr>
                <td>${escapeHtml(fmtDate(row.occurred_at, true))}</td>
                <td>${escapeHtml(auditUserName(row))}</td>
                <td>${escapeHtml(row.incident_id || "")}</td>
                <td>${escapeHtml(row.action || "")}</td>
                <td>${escapeHtml(row.changed_field || "")}</td>
                <td>${escapeHtml(row.old_value || "")}</td>
                <td>${escapeHtml(row.new_value || "")}</td>
                <td>${escapeHtml(row.comment || "")}</td>
              </tr>
            `).join("") || `<tr><td colspan="8" class="empty">Sin movimientos.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderUsers() {
  if (!canManageUsers()) {
    return `
      ${pageHead("Usuarios", "Administración de accesos.")}
      <div class="error">No tienes permisos para administrar usuarios.</div>
    `;
  }
  const rows = filteredProfiles();
  return `
    ${pageHead("Usuarios", "Administración de accesos, roles y estados.", `<button class="btn primary" data-action="new-user">Nuevo usuario</button>`)}
    ${renderUserFilters()}
    <div class="toolbar">
      <strong>${rows.length} usuario(s)</strong>
      <span class="muted">Los cambios quedan registrados en bitácora.</span>
    </div>
    <div class="excel-wrap">
      <div class="excel-scroller">
        <table class="excel">
          <thead><tr><th>Usuario</th><th>Password</th><th>Nombre</th><th>Rol</th><th>Estado</th><th>Último acceso</th><th>Intentos fallidos</th><th>Bloqueado</th><th>Debe cambiar password</th><th>Acciones</th></tr></thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td>${escapeHtml(row.username || "")}</td>
                <td>${escapeHtml(row.password_mask || PASSWORD_MASK)}</td>
                <td>${escapeHtml(row.display_name || "")}</td>
                <td>${badge(row.role || "Auditor")}</td>
                <td>${badge(row.status || "Activo")}</td>
                <td>${escapeHtml(fmtDate(row.last_access_at, true))}</td>
                <td>${escapeHtml(row.failed_attempts ?? 0)}</td>
                <td>${badge(boolText(Boolean(row.blocked)))}</td>
                <td>${badge(boolText(Boolean(row.must_change_password)))}</td>
                <td>
                  <div class="table-actions">
                    <button class="btn tiny" data-action="edit-user" data-id="${escapeHtml(row.id)}">Editar</button>
                    <button class="btn tiny" data-action="toggle-user" data-id="${escapeHtml(row.id)}">${row.status === "Activo" ? "Desactivar" : "Activar"}</button>
                    <button class="btn tiny" data-action="toggle-blocked" data-id="${escapeHtml(row.id)}">${row.blocked ? "Desbloquear" : "Bloquear"}</button>
                    <button class="btn tiny" data-action="password-user" data-id="${escapeHtml(row.id)}">Contraseña</button>
                    <button class="btn tiny" data-action="audit-user" data-id="${escapeHtml(row.id)}">Bitácora</button>
                  </div>
                </td>
              </tr>
            `).join("") || `<tr><td colspan="10" class="empty">No hay usuarios con los filtros seleccionados.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function filteredProfiles() {
  const f = state.userFilters;
  return state.profiles.filter((row) => {
    const text = `${row.username || ""} ${row.display_name || ""}`.toLowerCase();
    return (!f.search || text.includes(f.search.toLowerCase()))
      && matchesFilter(f.role, row.role)
      && matchesFilter(f.status, row.status);
  });
}

function renderUserFilters() {
  const f = state.userFilters;
  return `
    <div class="filters user-filters">
      <div class="field"><label>Buscar</label><input data-user-filter="search" value="${escapeHtml(f.search)}" placeholder="Usuario o nombre"></div>
      ${renderMultiFilter("users", "role", "Rol", ROLES, f.role)}
      ${renderMultiFilter("users", "status", "Estado", PROFILE_STATUSES, f.status)}
    </div>
  `;
}

function renderTableHeader(column) {
  const sorted = state.incidentSort.key === column.sortKey ? state.incidentSort.direction : "";
  return `
    <div class="excel-th">
      <span>${escapeHtml(column.label)}${sorted ? ` <b class="sort-mark">${sorted === "asc" ? "A-Z" : "Z-A"}</b>` : ""}</span>
      ${column.filterKey ? renderColumnFilter(column) : column.sortKey ? renderSortOnly(column) : ""}
    </div>
  `;
}

function renderSortOnly(column) {
  const menuId = `sort:${column.sortKey}`;
  const sorted = state.incidentSort.key === column.sortKey;
  return `
    <details class="column-filter sort-only" data-column-filter-menu="${escapeHtml(menuId)}" ${state.openFilterMenu === menuId ? "open" : ""}>
      <summary class="filter-trigger" title="Ordenar ${escapeHtml(column.label)}" aria-label="Ordenar ${escapeHtml(column.label)}"></summary>
      <div class="excel-filter-menu">
        <button type="button" data-column-filter-sort="${escapeHtml(column.sortKey)}" data-sort-dir="asc">Ordenar de A a Z</button>
        <button type="button" data-column-filter-sort="${escapeHtml(column.sortKey)}" data-sort-dir="desc">Ordenar de Z a A</button>
        ${sorted ? `<button type="button" data-column-sort-clear>Quitar orden</button>` : ""}
      </div>
    </details>
  `;
}

function renderColumnFilter(column) {
  const menuId = `column:${column.filterKey}`;
  const rawSelectedValues = filterValues(state.filters[column.filterKey]);
  const isEmptyFilter = rawSelectedValues.includes(NO_FILTER_MATCH);
  const selectedValues = rawSelectedValues.filter((value) => value !== NO_FILTER_MATCH);
  const active = selectedValues.length || isEmptyFilter;
  return `
    <button
      type="button"
      class="filter-trigger ${active ? "active" : ""}"
      data-column-filter-open="${escapeHtml(column.filterKey)}"
      data-column-filter-menu-id="${escapeHtml(menuId)}"
      title="Filtrar ${escapeHtml(column.label)}"
      aria-label="Filtrar ${escapeHtml(column.label)}"
      aria-expanded="${state.openFilterMenu === menuId ? "true" : "false"}">
    </button>
  `;
}

function renderOpenColumnFilterMenu(columns) {
  if (!state.openFilterMenu?.startsWith("column:")) return "";
  const key = state.openFilterMenu.slice("column:".length);
  const column = columns.find((item) => item.filterKey === key);
  if (!column) return "";
  const selectedValues = selectedFilterValues(state.filters[column.filterKey]);
  const values = [...new Set([...selectedValues, ...columnFilterValues(column)])];
  return renderColumnFilterMenu(column, values);
}

function renderColumnFilterMenu(column, values) {
  const rawSelectedValues = filterValues(state.filters[column.filterKey]);
  const isEmptyFilter = rawSelectedValues.includes(NO_FILTER_MATCH);
  const selectedValues = rawSelectedValues.filter((value) => value !== NO_FILTER_MATCH);
  const checkedValues = selectedValues.length ? selectedValues : isEmptyFilter ? [] : values;
  const allChecked = values.length > 0 && checkedValues.length === values.length;
  const sorted = state.incidentSort.key === column.sortKey;
  return `
      <div class="excel-filter-menu" data-column-filter-menu-panel="${escapeHtml(column.filterKey)}" style="--filter-menu-top:${state.filterMenuPosition.top}px;--filter-menu-left:${state.filterMenuPosition.left}px;">
        <button type="button" data-column-filter-sort="${escapeHtml(column.sortKey)}" data-sort-dir="asc">Ordenar de A a Z</button>
        <button type="button" data-column-filter-sort="${escapeHtml(column.sortKey)}" data-sort-dir="desc">Ordenar de Z a A</button>
        ${sorted ? `<button type="button" data-column-sort-clear>Quitar orden</button>` : ""}
        <button type="button" data-column-filter-clear="${escapeHtml(column.filterKey)}">Borrar filtro</button>
        <input class="excel-filter-search" data-filter-menu-search="${escapeHtml(column.filterKey)}" placeholder="Buscar">
        <label class="excel-filter-check all">
          <input type="checkbox" data-column-filter-select-all="${escapeHtml(column.filterKey)}" ${allChecked ? "checked" : ""}>
          <span>(Seleccionar todo)</span>
        </label>
        <label class="excel-filter-check add-selection">
          <input type="checkbox" data-column-filter-add="${escapeHtml(column.filterKey)}">
          <span>Agregar la selección actual al filtro</span>
        </label>
        <div class="excel-filter-options">
          ${column.type === "date" ? renderDateFilterOptions(column, values, checkedValues) : values.map((value) => `
            <label class="excel-filter-check" data-filter-option-row data-filter-text="${escapeHtml(canonicalUser(columnOptionLabel(value, column)))}">
              <input type="checkbox" data-column-filter-option="${escapeHtml(column.filterKey)}" value="${escapeHtml(value)}" ${checkedValues.includes(value) ? "checked" : ""}>
              <span>${escapeHtml(columnOptionLabel(value, column))}</span>
            </label>
          `).join("") || `<div class="empty compact-empty">Sin opciones</div>`}
        </div>
        <div class="excel-filter-actions">
          <button type="button" data-column-filter-apply="${escapeHtml(column.filterKey)}">Aceptar</button>
          <button type="button" data-column-filter-cancel>Cancelar</button>
        </div>
      </div>
  `;
}

function monthLabel(yearMonth) {
  const [year, month] = yearMonth.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat("es-DO", { month: "long" }).format(date);
}

function renderDateFilterOptions(column, values, checkedValues) {
  const emptyValues = values.filter((value) => value === EMPTY_FILTER_LABEL);
  const dateValues = values.filter((value) => value !== EMPTY_FILTER_LABEL && /^\d{4}-\d{2}-\d{2}$/.test(value));
  const grouped = new Map();
  dateValues.forEach((value) => {
    const [year, month] = value.split("-");
    if (!grouped.has(year)) grouped.set(year, new Map());
    const months = grouped.get(year);
    if (!months.has(month)) months.set(month, []);
    months.get(month).push(value);
  });
  const emptyHtml = emptyValues.map((value) => renderDateLeaf(column, value, checkedValues)).join("");
  const dateHtml = [...grouped.entries()].map(([year, months]) => {
    const yearValues = [...months.values()].flat();
    return `
      <div class="excel-date-group collapsed" data-date-group>
        <div class="excel-date-row">
          <button type="button" class="date-toggle" data-date-toggle aria-label="Expandir ${escapeHtml(year)}"></button>
          <label class="excel-filter-check date-group-check">
            <input type="checkbox" data-column-filter-date-group="${escapeHtml(column.filterKey)}" data-date-prefix="${escapeHtml(year)}" ${yearValues.every((value) => checkedValues.includes(value)) ? "checked" : ""}>
            <span>${escapeHtml(year)}</span>
          </label>
        </div>
        <div class="excel-date-children">
          ${[...months.entries()].map(([month, days]) => {
            const monthKey = `${year}-${month}`;
            return `
              <div class="excel-date-group collapsed" data-date-group>
                <div class="excel-date-row month-row">
                  <button type="button" class="date-toggle" data-date-toggle aria-label="Expandir ${escapeHtml(monthLabel(monthKey))}"></button>
                  <label class="excel-filter-check date-group-check">
                    <input type="checkbox" data-column-filter-date-group="${escapeHtml(column.filterKey)}" data-date-prefix="${escapeHtml(monthKey)}" ${days.every((value) => checkedValues.includes(value)) ? "checked" : ""}>
                    <span>${escapeHtml(monthLabel(monthKey))}</span>
                  </label>
                </div>
                <div class="excel-date-children">
                  ${days.map((value) => renderDateLeaf(column, value, checkedValues)).join("")}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }).join("");
  return `${emptyHtml}${dateHtml}` || `<div class="empty compact-empty">Sin opciones</div>`;
}

function renderDateLeaf(column, value, checkedValues) {
  const label = columnOptionLabel(value, column);
  return `
    <label class="excel-filter-check date-leaf" data-filter-option-row data-filter-text="${escapeHtml(canonicalUser(`${value} ${label}`))}">
      <input type="checkbox" data-column-filter-option="${escapeHtml(column.filterKey)}" data-date-value="${escapeHtml(value)}" value="${escapeHtml(value)}" ${checkedValues.includes(value) ? "checked" : ""}>
      <span>${escapeHtml(label)}</span>
    </label>
  `;
}

function renderCatalogs() {
  return `
    ${pageHead("Catálogos", "Valores usados por formularios y filtros.", `<button class="btn primary" data-action="new-catalog">Nuevo valor</button>`)}
    <div class="excel-wrap">
      <div class="excel-scroller">
        <table class="excel">
          <thead><tr><th>Categoría</th><th>Valor</th></tr></thead>
          <tbody>
            ${state.catalogs.map((row) => `<tr><td>${escapeHtml(categoryLabel(row.category))}</td><td>${escapeHtml(row.value)}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function auditUserName(row) {
  return state.profiles.find((profile) => profile.id === row.user_id)?.display_name || row.legacy_user || "";
}

function checkedFilterValues(selector, key, datasetKey) {
  return [...document.querySelectorAll(selector)]
    .filter((input) => input.dataset[datasetKey] === key && input.checked)
    .map((input) => input.value);
}

function closeFilterMenus(currentMenu) {
  document.querySelectorAll("[data-multi-filter-menu], [data-column-filter-menu]").forEach((menu) => {
    if (menu !== currentMenu) menu.open = false;
  });
}

function columnFilterOptions(menu, key) {
  return [...(menu?.querySelectorAll("[data-column-filter-option]") || [])]
    .filter((option) => option.dataset.columnFilterOption === key);
}

function visibleColumnFilterOptions(menu, key) {
  return columnFilterOptions(menu, key).filter((option) => !option.closest("[data-filter-option-row]")?.hidden);
}

function columnFilterSelectAll(menu, key) {
  return [...(menu?.querySelectorAll("[data-column-filter-select-all]") || [])]
    .find((option) => option.dataset.columnFilterSelectAll === key);
}

function columnFilterAddSelection(menu, key) {
  return [...(menu?.querySelectorAll("[data-column-filter-add]") || [])]
    .find((option) => option.dataset.columnFilterAdd === key);
}

function updateColumnFilterSelectAll(menu, key) {
  const options = visibleColumnFilterOptions(menu, key);
  const selectAll = columnFilterSelectAll(menu, key);
  if (!selectAll) return;
  const checkedCount = options.filter((option) => option.checked).length;
  selectAll.checked = options.length > 0 && checkedCount === options.length;
  selectAll.indeterminate = checkedCount > 0 && checkedCount < options.length;
}

function updateDateGroupStates(menu, key) {
  [...(menu?.querySelectorAll("[data-column-filter-date-group]") || [])].forEach((group) => {
    const prefix = group.dataset.datePrefix;
    const options = columnFilterOptions(menu, key).filter((option) => option.value.startsWith(prefix));
    const checkedCount = options.filter((option) => option.checked).length;
    group.checked = options.length > 0 && checkedCount === options.length;
    group.indeterminate = checkedCount > 0 && checkedCount < options.length;
  });
}

function updateDateGroupVisibility(menu) {
  [...(menu?.querySelectorAll("[data-date-group]") || [])].reverse().forEach((group) => {
    group.hidden = !group.querySelector("[data-filter-option-row]:not([hidden])");
  });
}

function renderPageKeepingInput(input, selector, datasetKey) {
  const key = input.dataset[datasetKey];
  const cursor = input.selectionStart ?? input.value.length;
  renderPage();
  const nextInput = [...document.querySelectorAll(selector)].find((item) => item.dataset[datasetKey] === key);
  if (!nextInput) return;
  nextInput.focus();
  if (typeof nextInput.setSelectionRange === "function") {
    const nextCursor = Math.min(cursor, nextInput.value.length);
    nextInput.setSelectionRange(nextCursor, nextCursor);
  }
}

function columnMenuPosition(trigger) {
  const width = 306;
  const margin = 10;
  const rect = trigger.getBoundingClientRect();
  const left = Math.min(Math.max(rect.right - width, margin), window.innerWidth - width - margin);
  const below = rect.bottom + 6;
  const maxHeight = Math.min(430, window.innerHeight - margin * 2);
  const top = below + maxHeight > window.innerHeight - margin
    ? Math.max(margin, rect.top - maxHeight - 6)
    : below;
  return { top: Math.round(top), left: Math.round(left) };
}

function handleColumnFilterClick(event) {
  const target = event.target.closest("[data-column-filter-open], [data-column-filter-apply], [data-column-filter-clear], [data-column-filter-cancel], [data-column-filter-sort], [data-column-sort-clear], [data-date-toggle]");
  if (!target) return;
  event.preventDefault();

  if (target.dataset.columnFilterOpen) {
    const menuId = target.dataset.columnFilterMenuId;
    if (state.openFilterMenu === menuId) {
      state.openFilterMenu = "";
    } else {
      state.openFilterMenu = menuId;
      state.filterMenuPosition = columnMenuPosition(target);
    }
    renderPage();
    return;
  }

  if (target.dataset.dateToggle !== undefined) {
    target.closest("[data-date-group]")?.classList.toggle("collapsed");
    return;
  }

  if (target.dataset.columnFilterApply) {
    const key = target.dataset.columnFilterApply;
    const menu = target.closest(".excel-filter-menu");
    const options = columnFilterOptions(menu, key);
    const addSelection = columnFilterAddSelection(menu, key)?.checked;
    const selectedValues = options.filter((option) => option.checked).map((option) => option.value);
    const nextValues = addSelection
      ? [...new Set([...selectedFilterValues(state.filters[key]), ...selectedValues])]
      : selectedValues;
    state.filters[key] = nextValues.length === options.length ? [] : nextValues.length ? nextValues : [NO_FILTER_MATCH];
    state.openFilterMenu = "";
    renderPage();
    return;
  }

  if (target.dataset.columnFilterClear) {
    state.filters[target.dataset.columnFilterClear] = [];
    state.openFilterMenu = "";
    renderPage();
    return;
  }

  if (target.hasAttribute("data-column-filter-cancel")) {
    state.openFilterMenu = "";
    renderPage();
    return;
  }

  if (target.dataset.columnFilterSort) {
    state.incidentSort = {
      key: target.dataset.columnFilterSort,
      direction: target.dataset.sortDir
    };
    state.openFilterMenu = "";
    renderPage();
    return;
  }

  if (target.hasAttribute("data-column-sort-clear")) {
    state.incidentSort = { key: "", direction: "" };
    state.openFilterMenu = "";
    renderPage();
  }
}

function bindPageEvents() {
  const pageRoot = document.querySelector("#page");
  if (pageRoot && !pageRoot.dataset.columnFilterHandlerBound) {
    pageRoot.dataset.columnFilterHandlerBound = "true";
    pageRoot.addEventListener("click", handleColumnFilterClick);
  }
  document.querySelectorAll("[data-multi-filter-menu]").forEach((menu) => {
    menu.addEventListener("toggle", () => {
      if (menu.open) {
        state.openFilterMenu = menu.dataset.multiFilterMenu;
        closeFilterMenus(menu);
      } else if (state.openFilterMenu === menu.dataset.multiFilterMenu) {
        state.openFilterMenu = "";
      }
    });
  });
  document.querySelectorAll("[data-filter]").forEach((input) => {
    const eventName = input.tagName === "SELECT" ? "change" : "input";
    input.addEventListener(eventName, () => {
      state.filters[input.dataset.filter] = input.value;
      renderPageKeepingInput(input, "[data-filter]", "filter");
    });
  });
  document.querySelectorAll("[data-filter-option]").forEach((input) => {
    input.addEventListener("change", () => {
      const key = input.dataset.filterOption;
      state.filters[key] = checkedFilterValues("[data-filter-option]", key, "filterOption");
      state.openFilterMenu = `incidents:${key}`;
      renderPage();
    });
  });
  document.querySelectorAll("[data-filter-clear]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.filterClear;
      state.filters[key] = [];
      state.openFilterMenu = `incidents:${key}`;
      renderPage();
    });
  });
  document.querySelectorAll("[data-filter-menu-search]").forEach((input) => {
    input.addEventListener("input", () => {
      const query = canonicalUser(input.value);
      const menu = input.closest(".excel-filter-menu");
      const key = input.dataset.filterMenuSearch;
      menu?.querySelectorAll("[data-filter-option-row]").forEach((row) => {
        row.hidden = !row.dataset.filterText.includes(query);
      });
      updateDateGroupVisibility(menu);
      updateDateGroupStates(menu, key);
      updateColumnFilterSelectAll(menu, key);
    });
  });
  document.querySelectorAll("[data-column-filter-menu-panel]").forEach((menu) => {
    const key = menu.dataset.columnFilterMenuPanel;
    updateDateGroupStates(menu, key);
    updateColumnFilterSelectAll(menu, key);
  });
  document.querySelectorAll("[data-column-filter-select-all]").forEach((input) => {
    input.addEventListener("change", () => {
      const menu = input.closest(".excel-filter-menu");
      const key = input.dataset.columnFilterSelectAll;
      visibleColumnFilterOptions(menu, key).forEach((checkbox) => {
        checkbox.checked = input.checked;
      });
      updateDateGroupStates(menu, key);
      updateColumnFilterSelectAll(menu, key);
    });
  });
  document.querySelectorAll("[data-column-filter-option]").forEach((input) => {
    input.addEventListener("change", () => {
      const key = input.dataset.columnFilterOption;
      const menu = input.closest(".excel-filter-menu");
      updateDateGroupStates(menu, key);
      updateColumnFilterSelectAll(menu, key);
    });
  });
  document.querySelectorAll("[data-column-filter-date-group]").forEach((input) => {
    input.addEventListener("change", () => {
      const key = input.dataset.columnFilterDateGroup;
      const menu = input.closest(".excel-filter-menu");
      const prefix = input.dataset.datePrefix;
      columnFilterOptions(menu, key)
        .filter((checkbox) => checkbox.value.startsWith(prefix))
        .forEach((checkbox) => {
          checkbox.checked = input.checked;
        });
      updateDateGroupStates(menu, key);
      updateColumnFilterSelectAll(menu, key);
    });
  });
  document.querySelectorAll("[data-user-filter]").forEach((input) => {
    input.addEventListener("input", () => {
      state.userFilters[input.dataset.userFilter] = input.value;
      renderPageKeepingInput(input, "[data-user-filter]", "userFilter");
    });
  });
  document.querySelectorAll("[data-user-filter-option]").forEach((input) => {
    input.addEventListener("change", () => {
      const key = input.dataset.userFilterOption;
      state.userFilters[key] = checkedFilterValues("[data-user-filter-option]", key, "userFilterOption");
      state.openFilterMenu = `users:${key}`;
      renderPage();
    });
  });
  document.querySelectorAll("[data-user-filter-clear]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.userFilterClear;
      state.userFilters[key] = [];
      state.openFilterMenu = `users:${key}`;
      renderPage();
    });
  });
  document.querySelectorAll("[data-status-change]").forEach((select) => {
    select.addEventListener("change", async () => {
      const row = state.incidents.find((incident) => incident.id === select.dataset.statusChange);
      const nextStatus = select.value;
      if (!row || nextStatus === row.status) return;
      if (CLOSED.includes(nextStatus) && !CLOSED.includes(row.status)) {
        openCloseModal(row);
        return;
      }
      if (CLOSED.includes(row.status) && !CLOSED.includes(nextStatus)) {
        openReopenModal(row);
        return;
      }
      await updateIncident(row, { status: nextStatus }, "Cambio de estatus", `Estatus cambiado a ${nextStatus}.`);
    });
  });
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      handleAction(button.dataset.action, button.dataset.id).catch((error) => {
        console.error(error);
        showToast("No fue posible completar la acción.");
      });
    });
  });
}

async function handleAction(action, id) {
  const row = state.incidents.find((incident) => incident.id === id);
  const profile = state.profiles.find((item) => item.id === id);
  if (action === "new-incident") openIncidentModal();
  if (action === "edit") openIncidentModal(row);
  if (action === "open-incident" || action === "detail") openDetailModal(row);
  if (action === "comment") openCommentModal(row);
  if (action === "close") openCloseModal(row);
  if (action === "reopen") openReopenModal(row);
  if (action === "export-excel") exportExcel(filteredIncidents());
  if (action === "new-catalog") openCatalogModal();
  if (action === "new-user") openUserModal();
  if (action === "edit-user") openUserModal(profile);
  if (action === "toggle-user") await toggleUserStatus(profile);
  if (action === "toggle-blocked") await toggleUserBlocked(profile);
  if (action === "password-user") openPasswordModal(profile);
  if (action === "audit-user") openUserAuditModal(profile);
}

function modalHtml(title, body, footer = "", variant = "") {
  const modal = document.querySelector("#modal");
  modal.className = ["modal", variant].filter(Boolean).join(" ");
  modal.innerHTML = `
    <div class="modal-body">
      <div class="modal-head"><h3>${escapeHtml(title)}</h3><button class="btn ghost" data-modal-close>Cerrar</button></div>
      ${body}
      ${footer}
    </div>
  `;
  modal.showModal();
  modal.querySelector("[data-modal-close]").addEventListener("click", () => modal.close());
  return modal;
}

function openIncidentModal(row = null) {
  const isEdit = Boolean(row);
  const body = `
    <form id="incidentForm" class="form-grid">
      ${field("hotel", "División", row?.hotel, "select", getCatalog("División"))}
      ${field("department", "Departamento", row?.department, "select", getCatalog("Departamento"))}
      ${field("incident_type", "Tipo de incidencia", row?.incident_type, "select", getCatalog("Tipo de Incidencia"))}
      ${field("impact", "Impacto", row?.impact, "select", getCatalog("Impacto"))}
      ${field("priority", "Prioridad", row?.priority || "Media", "select", PRIORITIES)}
      ${field("status", "Estatus", row?.status || "Pendiente", "select", STATUSES)}
      ${field("due_at", "Fecha compromiso", row?.due_at || dueDate(row?.priority || "Media"), "date")}
      ${field("subject", "Asunto", row?.subject, "text", [], "form-full")}
      ${field("description", "Descripción", row?.description, "textarea", [], "form-full")}
      <button class="btn primary form-full" type="submit">${isEdit ? "Guardar cambios" : "Crear incidencia"}</button>
    </form>
  `;
  const modal = modalHtml(isEdit ? `Editar ${row.id}` : "Nueva incidencia", body);
  const form = modal.querySelector("#incidentForm");
  let submitting = false;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitting) return;
    const payload = formObject(form);
    if (!payload.hotel || !payload.department || !payload.incident_type || !payload.priority || !payload.subject || !payload.description) {
      showToast("Completa división, departamento, tipo, prioridad, asunto y descripción.");
      return;
    }
    const submitButton = form.querySelector("button[type='submit']");
    const defaultLabel = submitButton.textContent;
    submitting = true;
    submitButton.disabled = true;
    submitButton.textContent = isEdit ? "Guardando..." : "Creando...";
    try {
      if (isEdit) {
        await updateIncident(row, payload, "Actualización de incidencia", "Incidencia actualizada.");
      } else {
        await createIncident(payload);
      }
      modal.close();
    } catch (error) {
      console.error(error);
      showToast(isEdit ? "No fue posible guardar los cambios." : "No fue posible crear la incidencia.");
      submitting = false;
      submitButton.disabled = false;
      submitButton.textContent = defaultLabel;
    }
  });
}

function field(name, label, value = "", type = "text", options = [], extra = "") {
  if (type === "select") {
    return `<div class="field ${extra}"><label>${escapeHtml(label)}</label><select name="${name}">${optionList(options, value)}</select></div>`;
  }
  if (type === "textarea") {
    return `<div class="field ${extra}"><label>${escapeHtml(label)}</label><textarea name="${name}">${escapeHtml(value || "")}</textarea></div>`;
  }
  return `<div class="field ${extra}"><label>${escapeHtml(label)}</label><input name="${name}" type="${type}" value="${escapeHtml(value || "")}"></div>`;
}

function formObject(form) {
  return Object.fromEntries([...new FormData(form).entries()].map(([key, value]) => [key, normalize(value)]));
}

function activeAdminCountWith(targetId, nextRole, nextStatus, nextBlocked = false) {
  return state.profiles.filter((profile) => {
    const roleValue = profile.id === targetId ? nextRole : profile.role;
    const statusValue = profile.id === targetId ? nextStatus : profile.status;
    const blockedValue = profile.id === targetId ? nextBlocked : Boolean(profile.blocked);
    return roleValue === "Administrador" && statusValue === "Activo" && !blockedValue;
  }).length;
}

function validateProfilePayload(payload, existing = null) {
  if (!payload.username || !payload.display_name || !payload.role || !payload.status) {
    return "Usuario, nombre, rol y estado son obligatorios.";
  }
  if (!existing && normalize(payload.password).length < 8) return "La contraseña inicial debe tener al menos 8 caracteres.";
  if (!ROLES.includes(payload.role)) return "Selecciona un rol válido.";
  if (!PROFILE_STATUSES.includes(payload.status)) return "Selecciona un estado válido.";
  const duplicateUser = state.profiles.find((profile) =>
    profile.id !== existing?.id && canonicalUser(profile.username) === canonicalUser(payload.username)
  );
  if (duplicateUser) return "Ya existe un usuario con ese nombre de usuario.";
  const nextBlocked = boolValue(payload.blocked);
  if (existing?.id === state.profile?.id && existing.role === "Administrador") {
    if (payload.status !== "Activo") return "No puedes desactivar tu propio usuario administrador.";
    if (payload.role !== "Administrador") return "No puedes quitarte el rol Administrador desde tu propia sesión.";
    if (nextBlocked) return "No puedes bloquear tu propio usuario administrador.";
  }
  if (existing && activeAdminCountWith(existing.id, payload.role, payload.status, nextBlocked) < 1) {
    return "Debe quedar al menos un administrador activo.";
  }
  return "";
}

async function logUserAction(targetProfile, action, oldValue, newValue, comment) {
  await supabase.from("audit_log").insert({
    incident_id: null,
    user_id: state.profile?.id,
    legacy_user: state.profile?.display_name || state.profile?.username || "Usuario",
    action,
    changed_field: `Usuario: ${targetProfile?.username || ""}`,
    old_value: oldValue || "",
    new_value: newValue || "",
    comment,
    hotel: "",
    status: targetProfile?.status || ""
  });
}

function openUserModal(existing = null) {
  const isEdit = Boolean(existing);
  const body = `
    <form id="userForm" class="form-grid">
      ${!isEdit ? `
        <div class="field form-full">
          <label>Contraseña inicial</label>
          <input name="password" type="password" required autocomplete="new-password">
        </div>
      ` : ""}
      ${field("username", "Usuario", existing?.username || "")}
      ${field("display_name", "Nombre", existing?.display_name || "")}
      ${field("role", "Rol", existing?.role || "Auditor", "select", ROLES)}
      ${field("status", "Estado", existing?.status || "Activo", "select", PROFILE_STATUSES)}
      ${field("blocked", "Bloqueado", boolText(Boolean(existing?.blocked)), "select", YES_NO)}
      ${field("must_change_password", "Debe cambiar password", boolText(existing ? Boolean(existing.must_change_password) : true), "select", YES_NO)}
      <button class="btn primary form-full" type="submit">${isEdit ? "Guardar cambios" : "Crear usuario"}</button>
    </form>
  `;
  const modal = modalHtml(isEdit ? `Editar ${existing.username || "usuario"}` : "Nuevo usuario", body);
  modal.querySelector("#userForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = formObject(event.currentTarget);
    const validation = validateProfilePayload(payload, existing);
    if (validation) {
      showToast(validation);
      return;
    }
    try {
      await saveProfile(payload, existing);
      modal.close();
    } catch (error) {
      console.error(error);
      showToast(friendlyUserSaveError(error));
    }
  });
}

async function saveProfile(payload, existing = null) {
  const userPayload = {
    username: payload.username,
    display_name: payload.display_name,
    role: payload.role,
    status: payload.status,
    blocked: boolValue(payload.blocked),
    must_change_password: boolValue(payload.must_change_password)
  };
  if (!existing) userPayload.password = payload.password;
  const response = await requireOk(await supabase.rpc("app_save_user", {
    p_token: sessionToken(),
    p_user_id: existing?.id || null,
    p_user: userPayload
  }), existing ? "No se pudo actualizar el usuario." : "No se pudo crear el usuario.");
  if (!response?.ok) throw new Error(response?.reason || "No se pudo guardar el usuario.");
  showToast(existing ? "Usuario actualizado." : "Usuario creado.");
  await reload();
}

async function toggleUserStatus(profile) {
  if (!profile) return;
  const nextStatus = profile.status === "Activo" ? "Inactivo" : "Activo";
  const validation = validateProfilePayload({ ...profile, status: nextStatus }, profile);
  if (validation) {
    showToast(validation);
    return;
  }
  try {
    const response = await requireOk(await supabase.rpc("app_toggle_user_status", {
      p_token: sessionToken(),
      p_user_id: profile.id
    }), "No se pudo cambiar el estado.");
    if (!response?.ok) throw new Error(response?.reason || "No se pudo cambiar el estado.");
    showToast(`Usuario ${nextStatus.toLowerCase()}.`);
    await reload();
  } catch (error) {
    console.error(error);
    showToast("No fue posible cambiar el estado del usuario.");
  }
}

async function toggleUserBlocked(profile) {
  if (!profile) return;
  const nextBlocked = !profile.blocked;
  const validation = validateProfilePayload({ ...profile, blocked: boolText(nextBlocked) }, profile);
  if (validation) {
    showToast(validation);
    return;
  }
  try {
    const response = await requireOk(await supabase.rpc("app_toggle_user_blocked", {
      p_token: sessionToken(),
      p_user_id: profile.id
    }), "No se pudo cambiar el bloqueo.");
    if (!response?.ok) throw new Error(response?.reason || "No se pudo cambiar el bloqueo.");
    showToast(nextBlocked ? "Usuario bloqueado." : "Usuario desbloqueado.");
    await reload();
  } catch (error) {
    console.error(error);
    showToast("No fue posible cambiar el bloqueo del usuario.");
  }
}

function openPasswordModal(profile) {
  if (!profile) return;
  const modal = modalHtml(`Contraseña de ${profile.username || "usuario"}`, `
    <form id="resetPasswordForm" class="form-grid" autocomplete="off">
      <div class="field form-full">
        <label>Nueva contraseña temporal</label>
        <input name="password" type="password" required autocomplete="new-password">
      </div>
      ${field("must_change_password", "Debe cambiar password", "Sí", "select", YES_NO, "form-full")}
      <button class="btn primary form-full" type="submit">Restablecer contraseña</button>
    </form>
  `);
  modal.querySelector("#resetPasswordForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const payload = formObject(event.currentTarget);
    registerPasswordReset(profile, payload.password, boolValue(payload.must_change_password)).catch((error) => {
      console.error(error);
      showToast("No fue posible registrar el restablecimiento.");
    });
  });
}

async function registerPasswordReset(profile, password = "", mustChangePassword = true) {
  if (!profile) return;
  if (normalize(password).length < 8) {
    showToast("La contraseña temporal debe tener al menos 8 caracteres.");
    return;
  }
  const response = await requireOk(await supabase.rpc("app_admin_reset_password", {
    p_token: sessionToken(),
    p_user_id: profile.id,
    p_new_password: password,
    p_must_change_password: mustChangePassword
  }), "No se pudo restablecer la contraseña.");
  if (!response?.ok) throw new Error(response?.reason || "No se pudo restablecer la contraseña.");
  document.querySelector("#modal")?.close();
  showToast("Contraseña restablecida.");
  await reload();
}

function openUserAuditModal(profile) {
  if (!profile) return;
  const entries = state.audit.filter((item) => normalize(item.changed_field).includes(`Usuario: ${profile.username}`));
  modalHtml(`Bitácora de ${profile.username || "usuario"}`, `
    <div class="timeline">
      ${entries.map((item) => `
        <div class="timeline-item">
          <b>${escapeHtml(item.action)}</b> · <span class="muted">${escapeHtml(fmtDate(item.occurred_at, true))}</span>
          <p>${escapeHtml(item.comment || "")}</p>
          <p class="muted">${escapeHtml(short(item.old_value, 140))} → ${escapeHtml(short(item.new_value, 140))}</p>
        </div>
      `).join("") || `<div class="empty">Sin movimientos registrados para este usuario.</div>`}
    </div>
  `);
}

async function createIncident(payload) {
  const due = payload.due_at || dueDate(payload.priority);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const row = {
      id: incidentId(),
      ...payload,
      due_at: due,
      actual_due_at: due,
      created_by: state.profile?.id,
      updated_by: state.profile?.id,
      created_at: nowISO(),
      updated_at: nowISO()
    };
    try {
      await requireOk(await supabase.from("incidents").insert(row), "No se pudo crear la incidencia.");
      await insertAudit(row.id, "Creación", "Incidencia", "", "Creada", "Incidencia creada.", row);
      showToast(`Incidencia ${row.id} creada.`);
      await reload();
      return;
    } catch (error) {
      if (!isDuplicateIdError(error) || attempt === 2) throw error;
      await loadAppData();
    }
  }
}

async function updateIncident(row, changes, action, comment) {
  if (!row) return;
  const payload = { ...changes, updated_by: state.profile?.id, updated_at: nowISO() };
  if (payload.status && CLOSED.includes(payload.status) && !row.closed_at) payload.closed_at = nowISO();
  if (payload.status && !CLOSED.includes(payload.status)) payload.closed_at = null;

  await requireOk(await supabase.from("incidents").update(payload).eq("id", row.id), "No se pudo actualizar.");
  for (const [fieldName, newValue] of Object.entries(changes)) {
    if (String(row[fieldName] ?? "") !== String(newValue ?? "")) {
      await insertAudit(row.id, action, fieldName, row[fieldName], newValue, comment, { ...row, ...payload });
    }
  }
  showToast("Cambios guardados.");
  await reload();
}

async function insertAudit(incidentIdValue, action, fieldName, oldValue, newValue, comment, row) {
  await supabase.from("audit_log").insert({
    incident_id: incidentIdValue,
    user_id: state.profile?.id,
    legacy_user: state.profile?.display_name || state.profile?.username || "Usuario",
    action,
    changed_field: fieldName,
    old_value: oldValue ?? "",
    new_value: newValue ?? "",
    comment,
    hotel: row?.hotel || "",
    status: row?.status || ""
  });
}

function detailValue(value, fallback = "No registrado") {
  return normalize(value) || fallback;
}

function detailField(label, value, extra = "") {
  return `
    <div class="detail-field ${extra}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(detailValue(value))}</strong>
    </div>
  `;
}

function openDetailModal(row) {
  if (!row) return;
  const entries = state.audit.filter((item) => item.incident_id === row.id);
  const modal = modalHtml(row.subject || `Detalle ${row.id}`, `
    <div class="detail-modal-grid">
      <section class="detail-main">
        <div class="detail-badges">${badge(row.priority)} ${badge(row.status)} ${badge(slaInfo(row).label, slaInfo(row).cls)}</div>
        <div class="detail-grid">
          ${detailField("ID", row.id)}
          ${detailField("Fecha compromiso", fmtDate(row.due_at))}
          ${detailField("División", row.hotel)}
          ${detailField("Departamento", row.department)}
          ${detailField("Tipo", row.incident_type)}
          ${detailField("Asunto", row.subject)}
        </div>
        <div class="detail-description">
          <span>Descripción</span>
          <p>${escapeHtml(detailValue(row.description))}</p>
        </div>
        <div class="detail-grid detail-grid-secondary">
          ${detailField("Causa raíz", row.root_cause)}
          ${detailField("Acción tomada", row.action_taken)}
          ${detailField("Comentario final", row.final_comment, "wide")}
        </div>
      </section>
      <aside class="detail-side">
        <div class="detail-actions">
          <button class="btn" data-detail-action="comment" ${!canEditIncident(row, "comment") ? "disabled" : ""}>Comentar</button>
          <button class="btn" data-detail-action="edit" ${!canEditIncident(row, "edit") ? "disabled" : ""}>Editar</button>
          ${CLOSED.includes(row.status)
            ? `<button class="btn primary" data-detail-action="reopen" ${!canEditIncident(row, "reopen") ? "disabled" : ""}>Reabrir</button>`
            : `<button class="btn primary" data-detail-action="close" ${!canEditIncident(row, "close") ? "disabled" : ""}>Cerrar</button>`}
        </div>
        <div class="detail-log">
          <div class="detail-log-head">
            <h3>Bitácora</h3>
            <span>${entries.length}</span>
          </div>
          <div class="timeline detail-timeline">
            ${entries.map((item) => `
              <div class="timeline-item">
                <b>${escapeHtml(item.action)}</b> · <span class="muted">${escapeHtml(fmtDate(item.occurred_at, true))}</span>
                <p>${escapeHtml(item.changed_field || "General")}: ${escapeHtml(item.old_value || "")} → ${escapeHtml(item.new_value || "")}</p>
                <p>${escapeHtml(item.comment || "")}</p>
              </div>
            `).join("") || `<div class="empty">Sin movimientos.</div>`}
          </div>
        </div>
      </aside>
    </div>
  `, "", "incident-detail-modal");
  modal.querySelectorAll("[data-detail-action]").forEach((button) => {
    button.addEventListener("click", () => {
      modal.close();
      handleAction(button.dataset.detailAction, row.id).catch((error) => {
        console.error(error);
        showToast("No fue posible completar la acción.");
      });
    });
  });
}

function openCommentModal(row) {
  const modal = modalHtml(`Comentar ${row.id}`, `
    <form id="commentForm" class="form-grid">
      ${field("comment", "Comentario", "", "textarea", [], "form-full")}
      <button class="btn primary form-full" type="submit">Guardar comentario</button>
    </form>
  `);
  modal.querySelector("#commentForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = formObject(event.currentTarget);
    await insertAudit(row.id, "Comentario", "Comentario", "", payload.comment, payload.comment, row);
    showToast("Comentario guardado.");
    modal.close();
    await reload();
  });
}

function openCloseModal(row) {
  const modal = modalHtml(`Cerrar ${row.id}`, `
    <form id="closeForm" class="form-grid">
      ${field("root_cause", "Causa raíz", row.root_cause, "select", getCatalog("Causa raíz"))}
      ${field("action_taken", "Acción tomada", row.action_taken, "select", getCatalog("Acción tomada"))}
      ${field("close_reason", "Motivo de cierre", row.close_reason)}
      ${field("final_comment", "Comentario final", row.final_comment, "textarea", [], "form-full")}
      <button class="btn primary form-full" type="submit">Cerrar incidencia</button>
    </form>
  `);
  modal.querySelector("#closeForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = formObject(event.currentTarget);
    if (!payload.root_cause || !payload.action_taken || !payload.final_comment) {
      showToast("Causa raíz, acción tomada y comentario final son obligatorios.");
      return;
    }
    await updateIncident(row, { ...payload, status: "Cerrado", closed_at: nowISO() }, "Cierre formal", payload.final_comment);
    modal.close();
  });
}

function openReopenModal(row) {
  const modal = modalHtml(`Reabrir ${row.id}`, `
    <form id="reopenForm" class="form-grid">
      ${field("status", "Nuevo estatus", "En proceso", "select", STATUSES.filter((status) => !CLOSED.includes(status)))}
      ${field("comment", "Motivo de reapertura", "", "textarea", [], "form-full")}
      <button class="btn primary form-full" type="submit">Reabrir incidencia</button>
    </form>
  `);
  modal.querySelector("#reopenForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = formObject(event.currentTarget);
    if (!payload.comment) {
      showToast("El motivo es obligatorio.");
      return;
    }
    await updateIncident(row, { status: payload.status, closed_at: null }, "Reapertura", payload.comment);
    modal.close();
  });
}

function openCatalogModal() {
  const modal = modalHtml("Nuevo valor de catálogo", `
    <form id="catalogForm" class="form-grid">
      ${field("category", "Categoría", "", "select", Object.keys(CATALOG_DEFAULTS))}
      ${field("value", "Valor", "")}
      <button class="btn primary form-full" type="submit">Guardar</button>
    </form>
  `);
  modal.querySelector("#catalogForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = formObject(event.currentTarget);
    await requireOk(await supabase.from("catalogs").insert(payload), "No se pudo guardar el catálogo.");
    showToast("Catálogo guardado.");
    modal.close();
    await reload();
  });
}

function exportExcel(rows) {
  const headers = [
    "ID",
    "Fecha",
    "División",
    "Departamento",
    "Asunto",
    "Tipo",
    "Prioridad",
    "Estatus",
    "SLA",
    "Fecha compromiso",
    "Descripción",
    "Causa raíz",
    "Acción tomada",
    "Comentario final"
  ];
  const exportRows = rows.map((row) => ({
    ID: row.id || "",
    Fecha: fmtDate(row.created_at),
    División: row.hotel || "",
    Departamento: row.department || "",
    Asunto: row.subject || "",
    Tipo: row.incident_type || "",
    Prioridad: row.priority || "",
    Estatus: row.status || "",
    SLA: slaInfo(row).label,
    "Fecha compromiso": fmtDate(row.due_at),
    Descripción: row.description || "",
    "Causa raíz": row.root_cause || "",
    "Acción tomada": row.action_taken || "",
    "Comentario final": row.final_comment || ""
  }));
  const worksheet = XLSX.utils.json_to_sheet(exportRows, { header: headers });
  const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:A1");
  worksheet["!autofilter"] = { ref: XLSX.utils.encode_range(range) };
  worksheet["!cols"] = [
    { wch: 24 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 26 },
    { wch: 24 },
    { wch: 12 },
    { wch: 20 },
    { wch: 18 },
    { wch: 16 },
    { wch: 48 },
    { wch: 24 },
    { wch: 24 },
    { wch: 32 }
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Incidencias");
  XLSX.writeFile(workbook, `incidencias_filtradas_${todayISO()}.xlsx`);
}

async function reload() {
  await loadAppData();
  renderApp();
}

init().catch((error) => {
  console.error(error);
  app.innerHTML = `<main class="config-shell"><section class="config-card"><div class="error">${escapeHtml(error.message)}</div></section></main>`;
});
