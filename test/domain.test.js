import test from "node:test";
import assert from "node:assert/strict";
import { calculateSla, dashboardMetrics, isStrongPassword, pageSlice } from "../src/domain.js";

const today = new Date("2026-07-14T12:00:00-04:00");

test("calcula vencimientos abiertos con una fecha de referencia estable", () => {
  assert.deepEqual(
    calculateSla({ status: "Pendiente", priority: "Alta", due_at: "2026-07-12" }, today),
    { label: "Vencido 2d", days: -2, met: false, cls: "vencido" }
  );
  assert.equal(calculateSla({ status: "En proceso", due_at: "2026-07-14" }, today).label, "Vence hoy");
});

test("mide el SLA histórico solo sobre incidencias cerradas", () => {
  const metrics = dashboardMetrics([
    { status: "Pendiente", priority: "Crítica", due_at: "2026-07-20" },
    { status: "Cerrado", priority: "Alta", due_at: "2026-07-10", closed_at: "2026-07-10T12:00:00Z" },
    { status: "Resuelto", priority: "Media", due_at: "2026-07-10", closed_at: "2026-07-11T12:00:00Z" }
  ], today);

  assert.equal(metrics.criticalOpen.length, 1);
  assert.equal(metrics.closed.length, 2);
  assert.equal(metrics.closedInSla.length, 1);
  assert.equal(metrics.slaCompliance, 50);
});

test("pagina resultados sin permitir páginas fuera de rango", () => {
  const result = pageSlice([1, 2, 3, 4, 5], 9, 2);
  assert.deepEqual(result.rows, [5]);
  assert.equal(result.page, 3);
  assert.equal(result.totalPages, 3);
});

test("exige una contraseña larga y diversa", () => {
  assert.equal(isStrongPassword("Auditoria-2026"), true);
  assert.equal(isStrongPassword("auditoria-2026"), false);
  assert.equal(isStrongPassword("Auditoria2026"), false);
  assert.equal(isStrongPassword("Corta-1A"), false);
});
