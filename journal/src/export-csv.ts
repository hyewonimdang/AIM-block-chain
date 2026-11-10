/** data/activity-log.json → data/activity-log.csv (Excel에서 열리도록 BOM 포함) */
import { writeFileSync } from "node:fs";
import { loadLog, CSV_PATH } from "./store.js";

const HEADER = [
  "date",
  "task",
  "category",
  "interest",
  "focus",
  "minutes",
  "blockedAt",
  "solvedBy",
  "wantMore",
  "note",
] as const;

function cell(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const log = loadLog();
const lines = [
  HEADER.join(","),
  ...log.entries.map((e) => HEADER.map((h) => cell(e[h])).join(",")),
];
writeFileSync(CSV_PATH, "﻿" + lines.join("\n") + "\n", "utf8");
console.log(`CSV 저장됨 → ${CSV_PATH} (${log.entries.length}건)`);
