import { useCallback, useEffect, useState } from "react";
import { api, NODES } from "../api/client";
import type { Block, ValidationResult } from "../types";
import { BlockCard } from "./BlockCard";

/**
 * 체인 시각화 + 위변조 실험 (노드 1 기준)
 *
 * [시각화 로직]
 *  - validation.brokenAt 이 null 이 아니면, 그 index 이상의 블록은 전부 broken 으로 칠합니다.
 *    서버의 validateChain 은 첫 번째로 깨진 블록에서 멈추므로, 그 뒤는 "검증되지 않은" 영역입니다.
 *  - 카드 사이 화살표는 "왼쪽 블록의 hash → 오른쪽 블록의 prevHash" 연결을 뜻합니다.
 *    연결이 실제로 맞는지(hash === 다음 prevHash)를 보고 화살표 색을 바꿉니다.
 */
const NODE = NODES[0];

export function ChainView() {
  const [chain, setChain] = useState<Block[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [data, setData] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recompute, setRecompute] = useState(false);
  const [lastMine, setLastMine] = useState<{ attempts: number; elapsedMs: number } | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [c, v] = await Promise.all([api.getChain(NODE), api.validate(NODE)]);
      setChain(c.chain);
      setValidation(v);
      setError(null);
    } catch (e) {
      setError(`노드 1(${NODE})에 연결할 수 없습니다. 서버를 켜 주세요. (${(e as Error).message})`);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function addBlock() {
    if (!data.trim()) return;
    setBusy(true);
    try {
      const r = await api.addBlock(NODE, data.trim());
      setLastMine({ attempts: r.attempts, elapsedMs: r.elapsedMs });
      setData("");
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function tamper(index: number) {
    const next = window.prompt(`#${index} 블록의 data 를 무엇으로 바꿀까요?`, "hacked");
    if (next === null) return;
    try {
      await api.tamper(NODE, index, next, recompute);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const brokenAt = validation?.brokenAt ?? null;
  const isBroken = (b: Block) => brokenAt !== null && b.index >= brokenAt;

  return (
    <section>
      <h2>체인 / 위변조 — 노드 1</h2>

      {error && <p className="todo">{error}</p>}

      <div className="toolbar">
        <input
          value={data}
          onChange={(e) => setData(e.target.value)}
          placeholder="블록에 넣을 data"
          onKeyDown={(e) => e.key === "Enter" && addBlock()}
        />
        <button onClick={addBlock} disabled={busy}>
          {busy ? "채굴 중…" : "블록 추가 (채굴)"}
        </button>
        <label className="check">
          <input type="checkbox" checked={recompute} onChange={(e) => setRecompute(e.target.checked)} />
          위변조 시 hash 도 다시 계산 (실험 2)
        </label>
        <button onClick={refresh}>새로고침</button>
      </div>

      {lastMine && (
        <p className="muted">
          마지막 채굴: {lastMine.attempts.toLocaleString()}번 시도, {lastMine.elapsedMs} ms
        </p>
      )}

      {validation && (
        <p className={validation.valid ? "status ok" : "status bad"}>
          {validation.valid
            ? "✓ 체인 유효"
            : `✗ #${validation.brokenAt} 에서 깨짐 — ${validation.reason}`}
        </p>
      )}

      <div className="chain">
        {chain.map((b, i) => {
          const next = chain[i + 1];
          const linked = next ? next.prevHash === b.hash : true;
          return (
            <div key={b.index} className="chain-item">
              <BlockCard
                block={b}
                broken={isBroken(b)}
                reason={b.index === brokenAt ? validation?.reason : null}
                onTamper={tamper}
              />
              {next && <span className={`arrow${linked ? "" : " cut"}`}>{linked ? "→" : "⇢"}</span>}
            </div>
          );
        })}
      </div>

      <details className="help">
        <summary>실험 가이드</summary>
        <ol>
          <li>블록을 3개 이상 추가합니다.</li>
          <li>중간 블록의 "위변조"를 누릅니다 → 그 블록부터 빨갛게 변하고 이유는 hash mismatch.</li>
          <li>"hash 도 다시 계산"을 켜고 다시 위변조 → 그 블록은 멀쩡해 보이지만 <b>다음</b> 블록이 prevHash mismatch 로 깨집니다.</li>
          <li>마지막 블록을 hash 재계산으로 위변조하면? 검증이 통과합니다. 뒤에 아무도 없기 때문입니다. 단, 난이도 조건(앞자리 0)은 못 맞추므로 difficulty not met 로 걸립니다.</li>
        </ol>
      </details>
    </section>
  );
}
