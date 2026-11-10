import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import type { ActivityLog } from "./types.js";

const here = dirname(fileURLToPath(import.meta.url));
export const LOG_PATH = resolve(here, "../../data/activity-log.json");
export const CSV_PATH = resolve(here, "../../data/activity-log.csv");

const EMPTY: ActivityLog = {
  entries: [],
  confidence: [
    { week: 1, confidence: 7, note: "초기 가설: 분산 시스템 흥미 → 블록체인 백엔드 적합" },
    { week: 2, confidence: 4, note: "AI 반론 검증 + 채용공고 16건 분석 후 하락" },
  ],
};

export function loadLog(): ActivityLog {
  if (!existsSync(LOG_PATH)) return structuredClone(EMPTY);
  return JSON.parse(readFileSync(LOG_PATH, "utf8")) as ActivityLog;
}

export function saveLog(log: ActivityLog): void {
  writeFileSync(LOG_PATH, JSON.stringify(log, null, 2) + "\n", "utf8");
}
