import { useCallback, useEffect, useRef, useState } from "react";
import { api, NODES } from "../api/client";
import type { Block, ResolveResult, ValidationResult } from "../types";
import { BlockCard } from "./BlockCard";

/**
 * 노드 3개 동기화 시각화
 *
 *  - 1.5초마다 세 노드의 체인을 polling. 꺼진 노드는 회색.
 *  - "피어 연결": 모든 노드가 서로를 알게 등록. (분산 네트워크의 시작)
 *  - 각 노드에서 "블록 추가" → 전파되어 다른 노드에 나타나는지 확인.
 *  - 각 노드에서 "위변조" → 그 노드만 빨갛게 → "resolve" → 다른 노드의 긴 체인으로 복구.
 *  - 체인 길이가 바뀐 노드는 잠깐 강조됩니다.
 */
interface NodeState {
  url: string;
  online: boolean;
  chain: Block[];
  validation: ValidationResult | null;
  peers: string[];
  flash: boolean;
}

const POLL_MS = 1500;

export function NodesView() {
  const [nodes, setNodes] = useState<NodeState[]>(
    NODES.map((url) => ({ url, online: false, chain: [], validation: null, peers: [], flash: false })),
  );
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const prevLengths = useRef<number[]>(NODES.map(() => 0));

  const addLog = (msg: string) =>
    setLog((l) => [`${new Date().toLocaleTimeString()}  ${msg}`, ...l].slice(0, 30));

  const refresh = useCallback(async () => {
    const next = await Promise.all(
      NODES.map(async (url, i): Promise<NodeState> => {
        try {
          const [c, v, p] = await Promise.all([api.getChain(url), api.validate(url), api.getPeers(url)]);
          const changed = prevLengths.current[i] !== 0 && prevLengths.current[i] !== c.chain.length;
          prevLengths.current[i] = c.chain.length;
          return { url, online: true, chain: c.chain, validation: v, peers: p.peers, flash: changed };
        } catch {
          prevLengths.current[i] = 0;
          return { url, online: false, chain: [], validation: null, peers: [], flash: false };
        }
      }),
    );
    setNodes(next);
    if (next.some((n) => n.flash)) setTimeout(() => setNodes((ns) => ns.map((n) => ({ ...n, flash: false }))), 800);
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(refresh, POLL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  async function run(label: string, fn: () => Promise<string>) {
    setBusy(label);
    try {
      addLog(await fn());
    } catch (e) {
      addLog(`✗ ${label}: ${(e as Error).message}`);
    } finally {
      setBusy(null);
      await refresh();
    }
  }

  const connectAll = () =>
    run("connect", async () => {
      await Promise.all(NODES.map((url) => api.registerPeers(url, NODES)));
      return "모든 노드가 서로를 피어로 등록했습니다";
    });

  const addBlock = (url: string, i: number) =>
    run(`add-${i}`, async () => {
      const r = await api.addBlock(url, `from node${i + 1} @${Date.now() % 10000}`);
      return `노드${i + 1} 채굴 #${r.block.index} (${r.attempts}회) → 전파 성공 ${r.broadcast.ok.length}, 실패 ${r.broadcast.failed.length}`;
    });

  const tamper = (url: string, i: number) =>
    run(`tamper-${i}`, async () => {
      const n = nodes[i];
      if (n.chain.length < 2) return `노드${i + 1}: 위변조할 블록이 없습니다 (먼저 블록을 추가)`;
      const target = Math.max(1, Math.floor(n.chain.length / 2));
      await api.tamper(url, target, "hacked");
      return `노드${i + 1} #${target} 위변조 → 검증 실패 상태`;
    });

  const resolve = (url: string, i: number) =>
    run(`resolve-${i}`, async () => {
      const r: ResolveResult = await api.resolve(url);
      return r.replaced
        ? `노드${i + 1} resolve: ${r.source} 의 체인(길이 ${r.newLength})으로 교체`
        : `노드${i + 1} resolve: 교체 없음 (내 체인이 가장 길거나 같음)`;
    });

  return (
    <section>
      <h2>노드 동기화 (분산 네트워크)</h2>
      <div className="toolbar">
        <button onClick={connectAll} disabled={busy !== null}>
          1. 피어 연결 (3 노드 서로 등록)
        </button>
        <span className="muted">터미널 3개에서 npm run node1 / node2 / node3 를 먼저 실행하세요.</span>
      </div>

      <div className="nodes-grid">
        {nodes.map((n, i) => {
          const brokenAt = n.validation?.brokenAt ?? null;
          return (
            <div key={n.url} className={`node-panel${n.online ? "" : " offline"}${n.flash ? " flash" : ""}`}>
              <div className="node-head">
                <strong>노드 {i + 1}</strong>
                <span className="muted">{n.url.replace("http://localhost", ":")}</span>
                <span className={n.online ? "dot on" : "dot"} />
              </div>
              <div className="muted small">
                길이 {n.chain.length} · 피어 {n.peers.length} ·{" "}
                {n.validation ? (n.validation.valid ? "✓ 유효" : `✗ #${n.validation.brokenAt} ${n.validation.reason}`) : "-"}
              </div>
              <div className="node-actions">
                <button className="small" disabled={!n.online || busy !== null} onClick={() => addBlock(n.url, i)}>
                  블록 추가
                </button>
                <button className="small danger" disabled={!n.online || busy !== null} onClick={() => tamper(n.url, i)}>
                  위변조
                </button>
                <button className="small" disabled={!n.online || busy !== null} onClick={() => resolve(n.url, i)}>
                  resolve
                </button>
              </div>
              <div className="node-chain">
                {n.chain.map((b) => (
                  <BlockCard key={b.index} block={b} compact broken={brokenAt !== null && b.index >= brokenAt} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="dash-card" style={{ marginTop: 16 }}>
        <h3>이벤트 로그</h3>
        {log.length === 0 ? <p className="muted">아직 없음</p> : <pre className="log">{log.join("\n")}</pre>}
      </div>

      <details className="help">
        <summary>실험 가이드</summary>
        <ol>
          <li>"피어 연결" 을 누릅니다. 각 노드의 피어 수가 2가 됩니다.</li>
          <li>노드 1 에서 "블록 추가" → 노드 2, 3 에도 같은 블록이 나타납니다 (전파).</li>
          <li>노드 2 에서 "위변조" → 노드 2 만 빨갛게 됩니다. 다른 노드는 영향 없음.</li>
          <li>노드 2 에서 "resolve" → 다른 노드의 유효한 체인으로 교체되어 복구됩니다. (내 체인이 깨져 있으면 같은 길이라도 교체. nodes.ts 의 규칙 2 예외와 그 이유를 읽어 보세요.)</li>
          <li>노드 3 을 끄고(터미널 Ctrl+C) 노드 1 에서 블록 추가 → 전파 실패 1. 노드 3 을 다시 켜고 resolve → 따라잡습니다.</li>
        </ol>
      </details>
    </section>
  );
}
