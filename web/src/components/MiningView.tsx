import { useEffect, useRef, useState } from "react";
import { api, NODES } from "../api/client";
import { calculateHash, hashMeetsDifficulty } from "../lib/hash";

/**
 * 채굴 시각화
 *
 *  A. 브라우저 채굴: 서버와 같은 해시 공식을 브라우저에서 직접 돌리며 nonce 가 올라가는 과정을 보여줍니다.
 *     (실제 체인에는 추가하지 않는 데모. 서버의 mineBlock 과 똑같은 while 루프입니다.)
 *  B. 서버 채굴: 노드 1 의 POST /blocks 를 호출해 난이도별 시도 횟수·시간을 표로 비교합니다.
 *
 * [학습 포인트] 난이도 1 올릴 때마다 시도 횟수가 약 16배. 표에서 직접 확인해 보세요.
 */
const NODE = NODES[0];

interface Run {
  difficulty: number;
  attempts: number;
  elapsedMs: number;
  hash: string;
  where: "browser" | "server";
}

export function MiningView() {
  const [difficulty, setDifficulty] = useState(3);
  const [serverDifficulty, setServerDifficulty] = useState<number | null>(null);
  const [nonce, setNonce] = useState(0);
  const [hash, setHash] = useState("");
  const [running, setRunning] = useState(false);
  const [runs, setRuns] = useState<Run[]>([]);
  const [error, setError] = useState<string | null>(null);
  const stop = useRef(false);

  useEffect(() => {
    api.getDifficulty(NODE).then((r) => setServerDifficulty(r.difficulty)).catch(() => null);
  }, []);

  /** A. 브라우저에서 직접 채굴 (서버 mineBlock 과 같은 구조) */
  async function mineInBrowser() {
    setRunning(true);
    stop.current = false;
    const index = 1;
    const timestamp = Date.now();
    const data = "browser-demo";
    const prevHash = "0".repeat(64);
    const started = performance.now();

    let n = 0;
    let h = await calculateHash(index, timestamp, data, prevHash, n);
    while (!hashMeetsDifficulty(h, difficulty) && !stop.current) {
      n += 1;
      h = await calculateHash(index, timestamp, data, prevHash, n);
      // 매번 setState 하면 너무 느려지므로 64번마다 화면 갱신 (await 가 있어 React 가 그릴 틈이 생김)
      if (n % 64 === 0) {
        setNonce(n);
        setHash(h);
      }
    }
    setNonce(n);
    setHash(h);
    if (!stop.current) {
      setRuns((r) => [
        { difficulty, attempts: n + 1, elapsedMs: Math.round(performance.now() - started), hash: h, where: "browser" },
        ...r,
      ]);
    }
    setRunning(false);
  }

  /** B. 서버에 채굴 요청 */
  async function mineOnServer() {
    setRunning(true);
    try {
      await api.setDifficulty(NODE, difficulty);
      setServerDifficulty(difficulty);
      const r = await api.addBlock(NODE, `mined@d${difficulty}`);
      setRuns((prev) => [
        { difficulty, attempts: r.attempts, elapsedMs: r.elapsedMs, hash: r.block.hash, where: "server" },
        ...prev,
      ]);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  const zeros = "0".repeat(difficulty);
  const matched = hash.startsWith(zeros) && hash !== "";

  return (
    <section>
      <h2>채굴 (작업증명)</h2>
      {error && <p className="todo">{error}</p>}

      <div className="toolbar">
        <label>
          난이도
          <select value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))} disabled={running}>
            {[1, 2, 3, 4, 5].map((d) => (
              <option key={d} value={d}>
                {d} (앞자리 0 × {d})
              </option>
            ))}
          </select>
        </label>
        <button onClick={mineInBrowser} disabled={running}>
          브라우저에서 채굴 (nonce 과정 보기)
        </button>
        <button onClick={mineOnServer} disabled={running}>
          서버에서 채굴 (노드 1 에 블록 추가)
        </button>
        {running && (
          <button className="danger" onClick={() => (stop.current = true)}>
            중지
          </button>
        )}
        {serverDifficulty !== null && <span className="muted">서버 현재 난이도: {serverDifficulty}</span>}
      </div>

      <div className="mine-panel">
        <div className="mine-nonce">
          nonce <strong>{nonce.toLocaleString()}</strong>
        </div>
        <div className={`mine-hash${matched ? " ok" : ""}`}>
          {hash ? (
            <>
              <span className="zeros">{hash.slice(0, difficulty)}</span>
              {hash.slice(difficulty)}
            </>
          ) : (
            <span className="muted">채굴을 시작하면 해시가 여기 표시됩니다</span>
          )}
        </div>
        <p className="muted">
          목표: 해시가 <code>{zeros}</code> 로 시작할 때까지 nonce 를 1씩 올리며 다시 계산. 평균 시도 횟수 ≈ 16^{difficulty} ={" "}
          {Math.pow(16, difficulty).toLocaleString()}
        </p>
      </div>

      {runs.length > 0 && (
        <table className="dash-table">
          <thead>
            <tr>
              <th>위치</th>
              <th>난이도</th>
              <th>시도 횟수</th>
              <th>시간(ms)</th>
              <th>해시</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r, i) => (
              <tr key={i}>
                <td>{r.where === "browser" ? "브라우저" : "서버"}</td>
                <td>{r.difficulty}</td>
                <td>{r.attempts.toLocaleString()}</td>
                <td>{r.elapsedMs.toLocaleString()}</td>
                <td className="hash">{r.hash.slice(0, 16)}…</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
