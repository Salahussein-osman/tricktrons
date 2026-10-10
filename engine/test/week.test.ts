import { test } from "node:test";
import assert from "node:assert/strict";
import { isoWeek, censusDay, weekYear } from "../src/week.ts";

test("known ISO week anchors", () => {
  assert.equal(isoWeek(new Date("2026-01-01")), "2026-W01"); // Jan 1 2026 is a Thursday
  assert.equal(isoWeek(new Date("2021-01-01")), "2020-W53"); // belongs to the previous year
  assert.equal(isoWeek(new Date("2016-01-01")), "2015-W53");
  assert.equal(isoWeek(new Date("2020-01-01")), "2020-W01");
});

test("format is always YYYY-Www", () => {
  for (const d of ["2026-03-15", "2026-07-01", "2026-12-31"]) {
    assert.match(isoWeek(new Date(d)), /^\d{4}-W\d{2}$/);
  }
});

test("Census Day is the Monday the next ISO year starts", () => {
  assert.equal(censusDay(2026).toISOString(), "2027-01-04T00:00:00.000Z");
  assert.equal(censusDay(2020).toISOString(), "2021-01-04T00:00:00.000Z"); // 2020 had 53 weeks
  assert.equal(censusDay(2024).toISOString(), "2024-12-30T00:00:00.000Z"); // 2025-W01 starts in December
});

test("Census Day is exactly when the last week of the year ends", () => {
  for (const y of [2024, 2025, 2026, 2027]) {
    const c = censusDay(y);
    assert.equal(weekYear(isoWeek(new Date(c.getTime() - 1))), y);
    assert.equal(isoWeek(c), `${y + 1}-W01`);
  }
});
