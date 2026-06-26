import { PostgrestClient } from "@supabase/postgrest-js";
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
const APP_SESSION_STORAGE_KEY = "auditoriaPendientes.session";
const SESSION_HEADER = "x-app-session-token";
const DIRECT_ADMIN_MODE = true;
const DIRECT_ADMIN_TOKEN = "direct-admin-bootstrap";
const USER_COLUMNS = "id, username, display_name, role, status, hotel, department, last_access_at, failed_attempts, blocked, must_change_password, created_at, updated_at";
const PASSWORD_MASK = "********";
const CATALOG_DEFAULTS = {
  Hotel: ["5910 - PPRL", "5911 - ZEL", "5917 - MPCB", "5918 - MCB", "5930 - PGC"],
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

const DIRECT_ADMIN_PROFILE = {
  id: null,
  username: "admin-directo",
  display_name: "Administrador Directo",
  role: "Administrador",
  status: "Activo",
  hotel: null,
  department: null,
  last_access_at: null,
  failed_attempts: 0,
  blocked: false,
  must_change_password: false,
  created_at: null,
  updated_at: null
};

const state = {
  session: null,
  profile: null,
  page: "dashboard",
  loading: true,
  incidents: [],
  audit: [],
  profiles: [],
  catalogs: [],
  selectedIncidentId: null,
  filters: {
    hotel: "",
    department: "",
    priority: "",
    status: "",
    responsible: "",
    type: "",
    search: ""
  },
  userFilters: {
    search: "",
    role: "",
    status: "",
    hotel: "",
    department: ""
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
  const date = new Date(value);
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

function directAdminSession() {
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  return { token: DIRECT_ADMIN_TOKEN, expires_at: expiresAt.toISOString() };
}

function isDirectAdminSession() {
  return DIRECT_ADMIN_MODE && sessionToken() === DIRECT_ADMIN_TOKEN;
}

function incidentId() {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  return `INC-${stamp}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
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
  const values = state.catalogs.filter((row) => row.category === category).map((row) => row.value).filter(Boolean);
  return values.length ? [...new Set(values)].sort() : CATALOG_DEFAULTS[category] || [];
}

function optionList(values, selected = "") {
  const all = [...new Set([selected, ...values].filter(Boolean))];
  return all.map((value) => `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(value)}</option>`).join("");
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

function clearSessionState() {
  state.session = null;
  state.profile = null;
  state.incidents = [];
  state.audit = [];
  state.profiles = [];
  state.selectedIncidentId = null;
}

async function init() {
  if (!supabase) {
    renderConfigMissing();
    return;
  }
  if (DIRECT_ADMIN_MODE) {
    setInternalSession(directAdminSession());
    state.profile = { ...DIRECT_ADMIN_PROFILE };
    state.page = "users";
    await loadAppData();
    renderApp();
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
  if (DIRECT_ADMIN_MODE) {
    setInternalSession(directAdminSession());
    state.profile = { ...DIRECT_ADMIN_PROFILE };
    state.page = "users";
    await loadAppData();
    renderApp();
    return;
  }
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
  if (isDirectAdminSession()) {
    state.profile = { ...DIRECT_ADMIN_PROFILE };
    return state.profile;
  }
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
  if (isDirectAdminSession()) {
    state.profile = { ...DIRECT_ADMIN_PROFILE };
  } else {
    await ensureProfile();
  }
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
  if (!state.selectedIncidentId && state.incidents[0]) state.selectedIncidentId = state.incidents[0].id;
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
          ${DIRECT_ADMIN_MODE ? `<span class="muted">Modo directo temporal</span>` : `<button class="btn ghost" id="logoutBtn">Cerrar sesión</button>`}
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
  document.querySelector("#logoutBtn")?.addEventListener("click", logout);
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
  return state.incidents.filter((row) => {
    const f = state.filters;
    const text = `${row.id} ${row.hotel} ${row.department} ${row.incident_type} ${row.description} ${row.responsible}`.toLowerCase();
    return (!f.hotel || row.hotel === f.hotel)
      && (!f.department || row.department === f.department)
      && (!f.priority || row.priority === f.priority)
      && (!f.status || row.status === f.status)
      && (!f.responsible || row.responsible === f.responsible)
      && (!f.type || row.incident_type === f.type)
      && (!f.search || text.includes(f.search.toLowerCase()));
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

function renderFilters() {
  const f = state.filters;
  const select = (key, label, values) => `
    <div class="field">
      <label>${label}</label>
      <select data-filter="${key}">
        <option value="">Todos</option>
        ${optionList(values, f[key])}
      </select>
    </div>
  `;
  return `
    <div class="filters">
      ${select("hotel", "Hotel", getDistinct("hotel"))}
      ${select("department", "Departamento", getDistinct("department"))}
      ${select("type", "Tipo", getDistinct("incident_type"))}
      ${select("priority", "Prioridad", PRIORITIES)}
      ${select("status", "Estatus", STATUSES)}
      ${select("responsible", "Responsable", getDistinct("responsible"))}
      <div class="field"><label>Buscar</label><input data-filter="search" value="${escapeHtml(f.search)}" placeholder="ID, descripción..."></div>
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
  const topResponsible = topValue(open, "responsible") || "Sin asignar";
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
      ${kpi("Responsable con más abiertas", topResponsible, "Carga operativa")}
      ${kpi("Departamento con más incidencias", topDepartment, "Concentración")}
    </div>
    <div class="charts">
      ${barPanel("Incidencias por hotel", rows, "hotel")}
      ${barPanel("Incidencias por departamento", rows, "department")}
      ${barPanel("Incidencias por prioridad", rows, "priority")}
      ${barPanel("Incidencias por estatus", rows, "status")}
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
  if (!state.selectedIncidentId && rows[0]) state.selectedIncidentId = rows[0].id;
  const selected = rows.find((row) => row.id === state.selectedIncidentId) || rows[0];
  if (selected) state.selectedIncidentId = selected.id;
  const createAction = canEditIncident(null, "create") ? `<button class="btn primary" data-action="new-incident">Nueva incidencia</button>` : "";
  return `
    ${pageHead("Incidencias", "Tabla tipo Excel, filtros, acciones y cierre formal.", createAction)}
    ${renderFilters()}
    <div class="toolbar">
      <strong>${rows.length} registro(s)</strong>
      <button class="btn" data-action="export-csv">Exportar CSV</button>
    </div>
    <div class="split">
      ${excelTable(rows)}
      <aside class="panel">${selected ? selectedPanel(selected) : `<div class="empty">Selecciona una incidencia.</div>`}</aside>
    </div>
  `;
}

function excelTable(rows) {
  const columns = [
    ["id", "ID"],
    ["created_at", "Fecha"],
    ["hotel", "Hotel"],
    ["department", "Departamento"],
    ["incident_type", "Tipo"],
    ["priority", "Prioridad"],
    ["status", "Estatus"],
    ["responsible", "Responsable"],
    ["sla", "SLA"],
    ["due_at", "Compromiso"],
    ["description", "Descripción"]
  ];
  return `
    <div class="excel-wrap">
      <div class="excel-scroller">
        <table class="excel">
          <thead><tr>${columns.map(([, label]) => `<th>${escapeHtml(label)}</th>`).join("")}</tr></thead>
          <tbody>
            ${rows.length ? rows.map((row) => `
              <tr data-select="${escapeHtml(row.id)}" class="${row.id === state.selectedIncidentId ? "selected" : ""}">
                ${columns.map(([key]) => `<td>${cellValue(row, key)}</td>`).join("")}
              </tr>
            `).join("") : `<tr><td colspan="${columns.length}" class="empty">No hay incidencias con los filtros seleccionados.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function cellValue(row, key) {
  if (key === "id") return `<button class="row-button" data-select="${escapeHtml(row.id)}">${escapeHtml(row.id)}</button>`;
  if (key === "created_at" || key === "due_at") return escapeHtml(fmtDate(row[key]));
  if (key === "priority") return badge(row.priority);
  if (key === "status") return badge(row.status);
  if (key === "sla") {
    const info = slaInfo(row);
    return badge(info.label, info.cls);
  }
  if (key === "description") return escapeHtml(short(row.description, 130));
  return escapeHtml(row[key] || "");
}

function selectedPanel(row) {
  const info = slaInfo(row);
  return `
    <h3>${escapeHtml(row.id)}</h3>
    <div class="selected-card">
      <div>${badge(row.priority)} ${badge(row.status)} ${badge(info.label, info.cls)}</div>
      <strong>${escapeHtml(row.hotel || "Sin hotel")}</strong>
      <span class="muted">${escapeHtml(row.department || "Sin departamento")} · Responsable: ${escapeHtml(row.responsible || "Sin asignar")}</span>
      <p>${escapeHtml(row.description || "")}</p>
    </div>
    <div class="actions">
      <button class="btn" data-action="detail" data-id="${escapeHtml(row.id)}">Detalle</button>
      <button class="btn" data-action="comment" data-id="${escapeHtml(row.id)}" ${!canEditIncident(row, "comment") ? "disabled" : ""}>Comentar</button>
      <button class="btn" data-action="edit" data-id="${escapeHtml(row.id)}" ${!canEditIncident(row, "edit") ? "disabled" : ""}>Editar</button>
      ${CLOSED.includes(row.status)
        ? `<button class="btn" data-action="reopen" data-id="${escapeHtml(row.id)}" ${!canEditIncident(row, "reopen") ? "disabled" : ""}>Reabrir</button>`
        : `<button class="btn primary" data-action="close" data-id="${escapeHtml(row.id)}" ${!canEditIncident(row, "close") ? "disabled" : ""}>Cerrar</button>`}
    </div>
  `;
}

function renderKanban() {
  const rows = filteredIncidents();
  return `
    ${pageHead("Kanban", "Seguimiento por estatus con cambio rápido.")}
    ${renderFilters()}
    <div class="kanban">
      ${STATUSES.map((status) => {
        const group = rows.filter((row) => row.status === status);
        return `
          <section class="kanban-col">
            <div class="kanban-head"><span>${escapeHtml(status)}</span><b>${group.length}</b></div>
            ${group.map((row) => `
              <article class="kanban-card">
                <button class="row-button" data-select="${escapeHtml(row.id)}" data-page-link="incidents">${escapeHtml(row.id)}</button>
                <span class="muted">${escapeHtml(row.hotel || "")} · ${escapeHtml(row.department || "")}</span>
                <span>${badge(row.priority)} ${badge(slaInfo(row).label, slaInfo(row).cls)}</span>
                <span>${escapeHtml(short(row.description, 95))}</span>
                <select data-status-change="${escapeHtml(row.id)}" ${!canEditIncident(row, "status") && !canEditIncident(row, "reopen") ? "disabled" : ""}>
                  ${optionList(statusOptionsFor(row), row.status)}
                </select>
              </article>
            `).join("") || `<div class="empty">Sin incidencias.</div>`}
          </section>
        `;
      }).join("")}
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
          <thead><tr><th>Usuario</th><th>Password</th><th>Nombre</th><th>Rol</th><th>Estado</th><th>Último acceso</th><th>Intentos fallidos</th><th>Bloqueado</th><th>Debe cambiar password</th><th>Hotel</th><th>Departamento</th><th>Acciones</th></tr></thead>
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
                <td>${escapeHtml(row.hotel || "")}</td>
                <td>${escapeHtml(row.department || "")}</td>
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
            `).join("") || `<tr><td colspan="12" class="empty">No hay usuarios con los filtros seleccionados.</td></tr>`}
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
      && (!f.role || row.role === f.role)
      && (!f.status || row.status === f.status)
      && (!f.hotel || row.hotel === f.hotel)
      && (!f.department || row.department === f.department);
  });
}

function renderUserFilters() {
  const f = state.userFilters;
  const select = (key, label, values) => `
    <div class="field">
      <label>${label}</label>
      <select data-user-filter="${key}">
        <option value="">Todos</option>
        ${optionList(values, f[key])}
      </select>
    </div>
  `;
  return `
    <div class="filters user-filters">
      <div class="field"><label>Buscar</label><input data-user-filter="search" value="${escapeHtml(f.search)}" placeholder="Usuario o nombre"></div>
      ${select("role", "Rol", ROLES)}
      ${select("status", "Estado", PROFILE_STATUSES)}
      ${select("hotel", "Hotel", profileDistinct("hotel"))}
      ${select("department", "Departamento", profileDistinct("department"))}
    </div>
  `;
}

function profileDistinct(fieldName) {
  return [...new Set(state.profiles.map((row) => normalize(row[fieldName])).filter(Boolean))].sort();
}

function renderCatalogs() {
  return `
    ${pageHead("Catálogos", "Valores usados por formularios y filtros.", `<button class="btn primary" data-action="new-catalog">Nuevo valor</button>`)}
    <div class="excel-wrap">
      <div class="excel-scroller">
        <table class="excel">
          <thead><tr><th>Categoría</th><th>Valor</th></tr></thead>
          <tbody>
            ${state.catalogs.map((row) => `<tr><td>${escapeHtml(row.category)}</td><td>${escapeHtml(row.value)}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function auditUserName(row) {
  return state.profiles.find((profile) => profile.id === row.user_id)?.display_name || row.legacy_user || "";
}

function bindPageEvents() {
  document.querySelectorAll("[data-filter]").forEach((input) => {
    input.addEventListener("input", () => {
      state.filters[input.dataset.filter] = input.value;
      renderPage();
    });
  });
  document.querySelectorAll("[data-user-filter]").forEach((input) => {
    input.addEventListener("input", () => {
      state.userFilters[input.dataset.userFilter] = input.value;
      renderPage();
    });
  });
  document.querySelectorAll("[data-select]").forEach((item) => {
    item.addEventListener("click", () => {
      state.selectedIncidentId = item.dataset.select;
      if (item.dataset.pageLink) state.page = item.dataset.pageLink;
      renderApp();
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
  if (action === "detail") openDetailModal(row);
  if (action === "comment") openCommentModal(row);
  if (action === "close") openCloseModal(row);
  if (action === "reopen") openReopenModal(row);
  if (action === "export-csv") exportCsv(filteredIncidents());
  if (action === "new-catalog") openCatalogModal();
  if (action === "new-user") openUserModal();
  if (action === "edit-user") openUserModal(profile);
  if (action === "toggle-user") await toggleUserStatus(profile);
  if (action === "toggle-blocked") await toggleUserBlocked(profile);
  if (action === "password-user") openPasswordModal(profile);
  if (action === "audit-user") openUserAuditModal(profile);
}

function modalHtml(title, body, footer = "") {
  const modal = document.querySelector("#modal");
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
      ${field("hotel", "Hotel", row?.hotel, "select", getCatalog("Hotel"))}
      ${field("department", "Departamento", row?.department, "select", getCatalog("Departamento"))}
      ${field("responsible_area", "Área responsable", row?.responsible_area, "select", getCatalog("Área Responsable"))}
      ${field("incident_type", "Tipo de incidencia", row?.incident_type, "select", getCatalog("Tipo de Incidencia"))}
      ${field("impact", "Impacto", row?.impact, "select", getCatalog("Impacto"))}
      ${field("priority", "Prioridad", row?.priority || "Media", "select", PRIORITIES)}
      ${field("status", "Estatus", row?.status || "Pendiente", "select", STATUSES)}
      ${field("responsible", "Responsable", row?.responsible)}
      ${field("due_at", "Fecha compromiso", row?.due_at || dueDate(row?.priority || "Media"), "date")}
      ${field("description", "Descripción", row?.description, "textarea", [], "form-full")}
      ${field("evidence_url", "Evidencia URL", row?.evidence_url, "url", [], "form-full")}
      <button class="btn primary form-full" type="submit">${isEdit ? "Guardar cambios" : "Crear incidencia"}</button>
    </form>
  `;
  const modal = modalHtml(isEdit ? `Editar ${row.id}` : "Nueva incidencia", body);
  modal.querySelector("#incidentForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = formObject(event.currentTarget);
    if (!payload.hotel || !payload.department || !payload.incident_type || !payload.priority || !payload.description) {
      showToast("Completa hotel, departamento, tipo, prioridad y descripción.");
      return;
    }
    if (isEdit) {
      await updateIncident(row, payload, "Actualización de incidencia", "Incidencia actualizada.");
    } else {
      await createIncident(payload);
    }
    modal.close();
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
    hotel: targetProfile?.hotel || "",
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
      ${field("hotel", "Hotel", existing?.hotel || "", "select", getCatalog("Hotel"))}
      ${field("department", "Departamento", existing?.department || "", "select", getCatalog("Departamento"))}
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
      showToast("No fue posible guardar el usuario. Verifica los datos e intenta nuevamente.");
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
    must_change_password: boolValue(payload.must_change_password),
    hotel: payload.hotel || null,
    department: payload.department || null
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
  await requireOk(await supabase.from("incidents").insert(row), "No se pudo crear la incidencia.");
  await insertAudit(row.id, "Creación", "Incidencia", "", "Creada", "Incidencia creada.", row);
  showToast("Incidencia creada.");
  await reload();
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

function openDetailModal(row) {
  modalHtml(`Detalle ${row.id}`, `
    <div class="selected-card">
      <div>${badge(row.priority)} ${badge(row.status)} ${badge(slaInfo(row).label, slaInfo(row).cls)}</div>
      <p><b>Hotel:</b> ${escapeHtml(row.hotel || "")}</p>
      <p><b>Departamento:</b> ${escapeHtml(row.department || "")}</p>
      <p><b>Responsable:</b> ${escapeHtml(row.responsible || "Sin asignar")}</p>
      <p><b>Descripción:</b><br>${escapeHtml(row.description || "")}</p>
      <p><b>Causa raíz:</b> ${escapeHtml(row.root_cause || "")}</p>
      <p><b>Acción tomada:</b> ${escapeHtml(row.action_taken || "")}</p>
      <p><b>Comentario final:</b> ${escapeHtml(row.final_comment || "")}</p>
    </div>
    <h3>Bitácora</h3>
    <div class="timeline">
      ${state.audit.filter((item) => item.incident_id === row.id).map((item) => `
        <div class="timeline-item">
          <b>${escapeHtml(item.action)}</b> · <span class="muted">${escapeHtml(fmtDate(item.occurred_at, true))}</span>
          <p>${escapeHtml(item.changed_field || "General")}: ${escapeHtml(item.old_value || "")} → ${escapeHtml(item.new_value || "")}</p>
          <p>${escapeHtml(item.comment || "")}</p>
        </div>
      `).join("") || `<div class="empty">Sin movimientos.</div>`}
    </div>
  `);
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
      ${field("evidence_url", "Evidencia URL", row.evidence_url, "url")}
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

function exportCsv(rows) {
  const headers = ["ID", "Fecha", "Hotel", "Departamento", "Tipo", "Prioridad", "Estatus", "Responsable", "SLA", "Descripción"];
  const csvRows = [
    headers.join(","),
    ...rows.map((row) => [
      row.id,
      fmtDate(row.created_at),
      row.hotel,
      row.department,
      row.incident_type,
      row.priority,
      row.status,
      row.responsible,
      slaInfo(row).label,
      row.description
    ].map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "incidencias_filtradas.csv";
  link.click();
  URL.revokeObjectURL(url);
}

async function reload() {
  await loadAppData();
  renderApp();
}

init().catch((error) => {
  console.error(error);
  app.innerHTML = `<main class="config-shell"><section class="config-card"><div class="error">${escapeHtml(error.message)}</div></section></main>`;
});
