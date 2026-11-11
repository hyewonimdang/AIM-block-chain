/**
 * 활동 일지 대시보드 (보일러플레이트, AI 작성)
 *
 * 데이터: ../../../data/activity-log.json 을 직접 import.
 *  - `npm run log` 로 기록을 추가하면 Vite 가 파일 변경을 감지해 자동으로 새로고침됩니다.
 *
 * 차트 3개:
 *  1. 구분별 평균 흥미도 · 몰입도 · 추가학습의향 (막대)
 *  2. 날짜별 흥미도 · 몰입도 추이 (선)
 *  3. 진로 가설 확신도 추이 (선, 0~10)
 */
import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import rawLog from "../../../data/activity-log.json";
import type { ActivityLog, ActivityEntry } from "../types";

const log = rawLog as ActivityLog;

const CATEGORIES = ["백엔드-블록체인", "백엔드-분산네트워크", "프론트엔드"] as const;

/** 검증된 범주 색 (dark surface 기준). 구분 → 고정 색, 순서 바꾸지 않음 */
const CATEGORY_COLOR: Record<(typeof CATEGORIES)[number], string> = {
  "백엔드-블록체인": "#3987e5",
  "백엔드-분산네트워크": "#d95926",
  프론트엔드: "#199e70",
};

/** 지표 색 (흥미/몰입/의향). 범주 색과 겹치지 않도록 같은 팔레트의 1~3번 슬롯 재사용 */
const METRIC_COLOR = { interest: "#3987e5", focus: "#d95926", wantMore: "#199e70" };

const GRID = "#2a2f3a";
const INK = "#8b93a7";

function avg(nums: number[]): number {
  return nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : 0;
}

function byCategory(entries: ActivityEntry[]) {
  return CATEGORIES.map((category) => {
    const rows = entries.filter((e) => e.category === category);
    return {
      category,
      count: rows.length,
      minutes: rows.reduce((a, e) => a + e.minutes, 0),
      interest: avg(rows.map((e) => e.interest)),
      focus: avg(rows.map((e) => e.focus)),
      wantMore: avg(rows.map((e) => e.wantMore)),
    };
  });
}

function byDate(entries: ActivityEntry[]) {
  const map = new Map<string, ActivityEntry[]>();
  for (const e of entries) map.set(e.date, [...(map.get(e.date) ?? []), e]);
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, rows]) => ({
      date: date.slice(5),
      interest: avg(rows.map((e) => e.interest)),
      focus: avg(rows.map((e) => e.focus)),
    }));
}

const tooltipStyle = {
  contentStyle: { background: "#181b22", border: `1px solid ${GRID}`, borderRadius: 8 },
  labelStyle: { color: "#e6e8ee" },
  itemStyle: { color: "#e6e8ee" },
};

export function JournalDashboard() {
  const [showTable, setShowTable] = useState(false);
  const cat = useMemo(() => byCategory(log.entries), []);
  const daily = useMemo(() => byDate(log.entries), []);
  const confidence = useMemo(
    () => [...log.confidence].sort((a, b) => a.week - b.week).map((c) => ({ ...c, label: `${c.week}주차` })),
    [],
  );

  if (log.entries.length === 0) {
    return (
      <section>
        <h2>활동 일지</h2>
        <p className="todo">
          아직 기록이 없습니다. 터미널에서 <code>npm run log</code> 로 첫 기록을 추가하세요.
        </p>
        <ConfidenceChart data={confidence} />
      </section>
    );
  }

  return (
    <section>
      <h2>활동 일지 ({log.entries.length}건)</h2>
      <div className="dash-grid">
        <div className="dash-card">
          <h3>구분별 평균 (1~5)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={cat} barGap={2}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="category" stroke={INK} tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 5]} stroke={INK} ticks={[1, 2, 3, 4, 5]} />
              <Tooltip {...tooltipStyle} cursor={{ fill: "#ffffff10" }} />
              <Legend />
              <Bar dataKey="interest" name="흥미도" fill={METRIC_COLOR.interest} radius={[4, 4, 0, 0]} />
              <Bar dataKey="focus" name="몰입도" fill={METRIC_COLOR.focus} radius={[4, 4, 0, 0]} />
              <Bar dataKey="wantMore" name="추가학습의향" fill={METRIC_COLOR.wantMore} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="dash-card">
          <h3>날짜별 추이</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={daily}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="date" stroke={INK} tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 5]} stroke={INK} ticks={[1, 2, 3, 4, 5]} />
              <Tooltip {...tooltipStyle} />
              <Legend />
              <Line type="monotone" dataKey="interest" name="흥미도" stroke={METRIC_COLOR.interest} strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="focus" name="몰입도" stroke={METRIC_COLOR.focus} strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <ConfidenceChart data={confidence} />

        <div className="dash-card">
          <h3>구분별 투입 시간</h3>
          <table className="dash-table">
            <thead>
              <tr>
                <th>구분</th>
                <th>건수</th>
                <th>총 시간</th>
                <th>흥미</th>
                <th>몰입</th>
                <th>의향</th>
              </tr>
            </thead>
            <tbody>
              {cat.map((c) => (
                <tr key={c.category}>
                  <td>
                    <span className="swatch" style={{ background: CATEGORY_COLOR[c.category] }} />
                    {c.category}
                  </td>
                  <td>{c.count}</td>
                  <td>{Math.round(c.minutes / 6) / 10}h</td>
                  <td>{c.interest}</td>
                  <td>{c.focus}</td>
                  <td>{c.wantMore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <button onClick={() => setShowTable((v) => !v)}>
          {showTable ? "원본 기록 숨기기" : "원본 기록 보기"}
        </button>
        {showTable && (
          <table className="dash-table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>날짜</th>
                <th>작업</th>
                <th>구분</th>
                <th>흥미</th>
                <th>몰입</th>
                <th>의향</th>
                <th>분</th>
                <th>막힌 지점</th>
                <th>해결</th>
                <th>소감</th>
              </tr>
            </thead>
            <tbody>
              {log.entries.map((e) => (
                <tr key={e.id}>
                  <td>{e.date}</td>
                  <td>{e.task}</td>
                  <td>{e.category}</td>
                  <td>{e.interest}</td>
                  <td>{e.focus}</td>
                  <td>{e.wantMore}</td>
                  <td>{e.minutes}</td>
                  <td>{e.blockedAt}</td>
                  <td>{e.solvedBy}</td>
                  <td>{e.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function ConfidenceChart({ data }: { data: { label: string; confidence: number; note: string }[] }) {
  return (
    <div className="dash-card">
      <h3>진로 가설 확신도 (0~10)</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" stroke={INK} />
          <YAxis domain={[0, 10]} stroke={INK} />
          <Tooltip
            {...tooltipStyle}
            formatter={(v: number) => [`${v}/10`, "확신도"]}
            labelFormatter={(label: string) => {
              const row = data.find((d) => d.label === label);
              return row ? `${label} · ${row.note}` : label;
            }}
          />
          <Line type="monotone" dataKey="confidence" stroke={METRIC_COLOR.interest} strokeWidth={2} dot={{ r: 5 }} label={{ position: "top", fill: "#e6e8ee", fontSize: 12 }} />
        </LineChart>
      </ResponsiveContainer>
      <p style={{ color: INK, fontSize: 12, margin: "8px 0 0" }}>
        3·4주차는 <code>npm run log:confidence</code> 로 입력
      </p>
    </div>
  );
}
