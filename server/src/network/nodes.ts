import type { Block, Chain } from "../blockchain/types.js";
import { chain, getLatestBlock, isBlockHashValid, validateChain, replaceChain } from "../blockchain/chain.js";
import { hashMeetsDifficulty, powConfig } from "../blockchain/pow.js";

/**
 * ───────────────────────────────────────────────
 * 5단계: 분산 네트워크 (노드 등록, 블록 전파, 최장 체인 채택)
 * ───────────────────────────────────────────────
 *
 * [학습 포인트]
 *  - 이 서버를 PORT=3001, 3002, 3003 으로 3개 띄우면 각각이 "노드"입니다.
 *    각 노드는 자기만의 chain 배열을 메모리에 갖고 있고, 처음엔 서로의 존재를 모릅니다.
 *  - 중앙 서버가 없습니다. 누가 정답 체인을 갖고 있는지 아무도 모릅니다.
 *    그래서 "규칙"으로 정답을 정합니다 → 가장 길고 유효한 체인이 정답 (Longest Chain Rule).
 *  - 노드 사이 통신은 평범한 HTTP 입니다. 다른 노드도 그냥 "다른 서버"일 뿐입니다.
 *  - 분산 시스템의 핵심 난점이 여기서 처음 등장합니다:
 *      · 상대가 꺼져 있을 수 있다 (실패해도 나머지는 계속 진행해야 함)
 *      · 상대가 거짓말할 수 있다 (받은 체인은 반드시 검증)
 *      · 두 노드가 동시에 블록을 만들 수 있다 (포크 → 나중에 긴 쪽이 이김)
 */

/** 내가 아는 다른 노드들의 주소. 예: "http://localhost:3002" */
export const peers = new Set<string>();

/** 다른 노드가 응답이 없을 때 무한정 기다리지 않도록 */
const FETCH_TIMEOUT_MS = 2000;

/** 끝의 슬래시를 제거해 "http://localhost:3002/" 와 "http://localhost:3002" 를 같게 취급 */
function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * 피어 주소를 등록합니다. 중복과 자기 자신은 제외합니다.
 * Set 을 쓰므로 같은 주소를 여러 번 등록해도 하나만 남습니다.
 */
export function registerPeers(urls: string[], selfUrl: string): string[] {
  const self = normalizeUrl(selfUrl);
  for (const raw of urls) {
    const url = normalizeUrl(raw);
    if (url && url !== self) peers.add(url);
  }
  return [...peers];
}

/**
 * 새 블록을 모든 피어에게 전파합니다. (POST {peer}/blocks/receive)
 *
 * [Promise.allSettled 를 쓰는 이유]
 *  Promise.all 은 하나라도 실패하면 전체가 reject 됩니다.
 *  분산 환경에서는 "노드 하나가 꺼져 있음"이 정상 상황이므로, 실패를 모아서 보고하고 계속 갑니다.
 */
export async function broadcastBlock(
  block: Block,
): Promise<{ ok: string[]; failed: string[] }> {
  const targets = [...peers];
  const results = await Promise.allSettled(
    targets.map((peer) =>
      fetch(`${peer}/blocks/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(block),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      }).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }),
    ),
  );

  const ok: string[] = [];
  const failed: string[] = [];
  results.forEach((r, i) => (r.status === "fulfilled" ? ok : failed).push(targets[i]));
  return { ok, failed };
}

/** 외부에서 들어온 JSON 이 Block 모양인지 확인. 신뢰할 수 없는 입력은 항상 검사합니다. */
export function isBlockShape(value: unknown): value is Block {
  if (typeof value !== "object" || value === null) return false;
  const b = value as Record<string, unknown>;
  return (
    Number.isInteger(b.index) &&
    typeof b.timestamp === "number" &&
    typeof b.data === "string" &&
    typeof b.prevHash === "string" &&
    typeof b.hash === "string" &&
    Number.isInteger(b.nonce)
  );
}

export type ReceiveStatus = "appended" | "need-sync" | "rejected";

/**
 * 다른 노드가 보낸 블록을 받았을 때 처리합니다.
 *
 *  - 내 마지막 블록 바로 뒤에 붙을 수 있고 유효하면 → 추가 ("appended")
 *  - 내 체인보다 2칸 이상 앞선 블록이면 → 내가 뒤처진 것 ("need-sync", 호출 측이 resolve 실행)
 *  - 그 외(이미 있는 블록, 유효하지 않은 블록) → "rejected"
 *
 * [생각해 볼 것]
 *  두 노드가 동시에 각자 블록 5번을 만들면? 서로의 블록은 "index 는 맞지만 prevHash 가 다름"으로
 *  rejected 됩니다. 이 상태가 "포크"입니다. 둘 중 하나가 6번을 먼저 만들어 전파하면
 *  상대는 need-sync → resolve → 더 긴 쪽을 채택하면서 포크가 해소됩니다.
 */
export function receiveBlock(block: unknown): ReceiveStatus {
  if (!isBlockShape(block)) return "rejected";

  const latest = getLatestBlock();

  if (block.index > latest.index + 1) return "need-sync";

  const fitsAfterLatest =
    block.index === latest.index + 1 &&
    block.prevHash === latest.hash &&
    isBlockHashValid(block) &&
    hashMeetsDifficulty(block.hash, powConfig.difficulty);

  if (!fitsAfterLatest) return "rejected";

  chain.push(block);
  return "appended";
}

/** 피어 하나의 체인을 가져옵니다. 실패하면 null (꺼져 있거나, 응답이 이상하거나). */
async function fetchPeerChain(peer: string): Promise<Chain | null> {
  try {
    const res = await fetch(`${peer}/chain`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) return null;
    const body = (await res.json()) as { chain?: unknown };
    if (!Array.isArray(body.chain) || !body.chain.every(isBlockShape)) return null;
    return body.chain;
  } catch {
    return null;
  }
}

export interface ResolveResult {
  replaced: boolean;
  newLength: number;
  source: string | null;
  /** 각 피어별 결과. 시각화와 디버깅용 */
  peers: { url: string; length: number | null; valid: boolean | null }[];
}

/**
 * 합의: 모든 피어의 체인을 가져와 "가장 길고 유효한 체인"으로 교체합니다.
 *
 * [규칙]
 *  1. 유효하지 않은 체인은 길이와 상관없이 무시 (거짓말하는 노드 방어)
 *  2. 내 체인보다 긴 것만 후보 (같은 길이면 내 것을 유지 → 불필요한 교체 방지)
 *     예외: 내 체인이 이미 유효하지 않으면(위변조됨) 같은 길이의 유효한 체인도 받아들입니다.
 *  3. 후보 중 가장 긴 것 채택
 *
 * [통합 테스트에서 발견한 버그 → 규칙 2 의 예외가 생긴 이유]
 *  노드 2 의 1번 블록을 위변조(data 만 변경)해도 마지막 블록의 hash 는 그대로이므로
 *  노드 1 이 보내는 새 블록을 계속 받아 길이가 같이 늘어납니다. 그러면 "더 긴 체인"이 없어서
 *  resolve 로 영영 복구되지 않았습니다. "내가 깨졌으면 같은 길이라도 교체" 가 필요했습니다.
 *
 * [생각해 볼 것]
 *  "길이"가 아니라 "들어간 작업량(난이도 합)"으로 비교해야 하는 경우는? → 노드마다 난이도가 다를 때.
 *  비트코인은 실제로 누적 작업량(chainwork)으로 비교합니다. 이 프로젝트는 난이도가 같다고 가정합니다.
 */
export async function resolveConflicts(): Promise<ResolveResult> {
  const targets = [...peers];
  const chains = await Promise.all(targets.map(fetchPeerChain));

  const selfValid = validateChain(chain).valid;
  // 내가 유효하면 "나보다 길어야" 후보, 내가 깨졌으면 "나와 같은 길이 이상"이면 후보
  const minLength = selfValid ? chain.length + 1 : chain.length;

  let best: Chain | null = null;
  let source: string | null = null;
  const report: ResolveResult["peers"] = [];

  targets.forEach((url, i) => {
    const candidate = chains[i];
    if (!candidate) {
      report.push({ url, length: null, valid: null });
      return;
    }
    const valid = validateChain(candidate).valid;
    report.push({ url, length: candidate.length, valid });

    const currentBestLength = best ? best.length + 1 : minLength;
    if (valid && candidate.length >= currentBestLength) {
      best = candidate;
      source = url;
    }
  });

  if (best) {
    replaceChain(best);
    return { replaced: true, newLength: chain.length, source, peers: report };
  }
  return { replaced: false, newLength: chain.length, source: null, peers: report };
}
