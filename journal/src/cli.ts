/**
 * 활동 일지 입력 CLI
 *
 *   npm run log            → 작업 기록 1건 추가
 *   npm run log -- --confidence   → 주차별 확신도 입력
 *   npm run log -- --list  → 기록 목록 출력
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { randomUUID } from "node:crypto";
import { loadLog, saveLog, LOG_PATH } from "./store.js";
import { CATEGORIES, type ActivityEntry, type Category, type Rating } from "./types.js";

const rl = createInterface({ input: stdin, output: stdout });

async function ask(q: string, fallback?: string): Promise<string> {
  const suffix = fallback !== undefined ? ` [${fallback}]` : "";
  const a = (await rl.question(`${q}${suffix}: `)).trim();
  return a === "" && fallback !== undefined ? fallback : a;
}

async function askRating(q: string): Promise<Rating> {
  for (;;) {
    const n = Number(await ask(`${q} (1~5)`));
    if (Number.isInteger(n) && n >= 1 && n <= 5) return n as Rating;
    console.log("  → 1~5 사이 정수를 입력하세요.");
  }
}

async function askNumber(q: string, min: number, max: number): Promise<number> {
  for (;;) {
    const n = Number(await ask(q));
    if (Number.isFinite(n) && n >= min && n <= max) return n;
    console.log(`  → ${min}~${max} 사이 숫자를 입력하세요.`);
  }
}

async function askCategory(): Promise<Category> {
  CATEGORIES.forEach((c, i) => console.log(`  ${i + 1}) ${c}`));
  for (;;) {
    const n = Number(await ask("구분 번호"));
    const c = CATEGORIES[n - 1];
    if (c) return c;
    console.log("  → 번호를 다시 입력하세요.");
  }
}

function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

async function addEntry() {
  console.log("\n=== 활동 일지 기록 ===");
  const entry: ActivityEntry = {
    id: randomUUID(),
    date: await ask("날짜", today()),
    task: await ask("작업명"),
    category: await askCategory(),
    interest: await askRating("흥미도"),
    focus: await askRating("몰입도"),
    minutes: await askNumber("소요시간(분)", 0, 10000),
    blockedAt: await ask("막힌 지점 (없으면 Enter)", ""),
    solvedBy: await ask("해결 방법 (없으면 Enter)", ""),
    wantMore: await askRating("추가 학습 의향"),
    note: await ask("한 줄 소감"),
  };
  const log = loadLog();
  log.entries.push(entry);
  saveLog(log);
  console.log(`\n저장됨 → ${LOG_PATH} (총 ${log.entries.length}건)`);
}

async function addConfidence() {
  console.log("\n=== 진로 가설 확신도 ===");
  const log = loadLog();
  log.confidence.forEach((c) => console.log(`  ${c.week}주차: ${c.confidence}/10  ${c.note}`));
  const week = await askNumber("주차", 1, 52);
  const confidence = await askNumber("확신도 (0~10)", 0, 10);
  const note = await ask("메모");
  const idx = log.confidence.findIndex((c) => c.week === week);
  const item = { week, confidence, note };
  if (idx >= 0) log.confidence[idx] = item;
  else log.confidence.push(item);
  log.confidence.sort((a, b) => a.week - b.week);
  saveLog(log);
  console.log(`\n저장됨 → ${LOG_PATH}`);
}

function list() {
  const log = loadLog();
  if (log.entries.length === 0) {
    console.log("기록 없음");
    return;
  }
  for (const e of log.entries) {
    console.log(
      `${e.date}  [${e.category}]  ${e.task}  흥미${e.interest} 몰입${e.focus} 의향${e.wantMore}  ${e.minutes}분`,
    );
  }
}

const arg = process.argv[2];
try {
  if (arg === "--confidence") await addConfidence();
  else if (arg === "--list") list();
  else await addEntry();
} finally {
  rl.close();
}
