import test from "node:test";
import assert from "node:assert/strict";
import { computeBudget, realisticDuration, rescale, estimateArrival, budgetForDay } from "./calc";
import { levelFromRatio, threeLightDays } from "./verdict";
import type { Profile, Meal } from "./types";

const p: Profile = { prenom: "A", age: 30, tailleCm: 165, poidsActuel: 63, poidsCible: 53, joursDanse: [2, 4] };

test("budget : Mifflin-St Jeor, -15 %, plafonné à 500", () => {
  const b = computeBudget(p, 63);
  assert.equal(b.bmr, Math.round(630 + 1031.25 - 150 - 161));
  assert.equal(b.depenseTotale, Math.round((630 + 1031.25 - 150 - 161) * 1.375));
  assert.equal(b.base, Math.round(b.depenseTotale * 0.85));
  assert.ok(b.deficit <= 500);
  assert.ok(b.base >= 1400);
});
test("plancher 1400", () => {
  const b = computeBudget({ ...p, age: 70, tailleCm: 150 }, 45);
  assert.equal(b.base, 1400);
  assert.ok(b.plancher);
});
test("bonus danse = 50 % de 5 MET × poids × 1 h", () => {
  assert.equal(computeBudget(p, 63).bonusDanse, Math.round(0.5 * 5 * 63));
  // 2 = mardi
  assert.ok(budgetForDay(p, 63, "2026-10-06") > budgetForDay(p, 63, "2026-10-07"));
});
test("durée : 10 kg ≈ 5 mois", () => {
  const d = realisticDuration(10);
  assert.equal(d.semaines, 20);
  assert.ok(Math.round(d.mois) === 5);
});
test("verdict seuils", () => {
  assert.equal(levelFromRatio(0.79), "peu");
  assert.equal(levelFromRatio(0.8), "parfait");
  assert.equal(levelFromRatio(1.05), "parfait");
  assert.equal(levelFromRatio(1.1), "au-dessus");
  assert.equal(levelFromRatio(1.21), "gourmand");
});
test("3 jours sous 1200", () => {
  const mk = (date: string, kcal: number): Meal => ({ id: date, date, type: "dejeuner", items: [{ id: "x", nom: "x", quantite: 1, unite: "unité", kcal, proteines: 0, glucides: 0, lipides: 0 }] });
  assert.ok(threeLightDays([mk("2026-10-06", 900), mk("2026-10-07", 1000), mk("2026-10-08", 1100)], "2026-10-08"));
  assert.ok(!threeLightDays([mk("2026-10-07", 1000), mk("2026-10-08", 1100)], "2026-10-08"));
});
test("rescale proportionnel", () => {
  const r = rescale({ id: "1", nom: "pain", quantite: 50, unite: "g", kcal: 120, proteines: 4, glucides: 22, lipides: 1 }, 100);
  assert.equal(r.kcal, 240);
});
test("arrivée estimée", () => {
  const e = estimateArrival([{ date: "2026-09-01", kg: 63 }, { date: "2026-09-29", kg: 61 }], 53, "2026-10-08");
  assert.ok(e && e.rate > 0.4 && e.rate < 0.6);
  assert.equal(estimateArrival([{ date: "2026-09-01", kg: 63 }], 53, "2026-10-08"), null);
});
