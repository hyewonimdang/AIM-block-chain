import type { Block, Chain } from "../blockchain/types.js";
import { chain, validateChain } from "../blockchain/chain.js";

/**
 * ───────────────────────────────────────────────
 * 5단계: 분산 네트워크 (노드 등록, 블록 전파, 최장 체인 채택)
 * ───────────────────────────────────────────────
 *
 * 개념:
 *  - 이 서버를 PORT=3001, 3002, 3003 으로 3개 띄우면 각각이 "노드"입니다.
 *    각 노드는 자기만의 chain 배열을 메모리에 갖고 있고, 서로 모릅니다.
 *  - 노드 등록(register): "나는 http://localhost:3002 도 알고 있다" 고 주소를 저장하는 것.
 *  - 전파(broadcast): 내가 블록을 만들면 아는 노드들에게 HTTP로 알려주는 것.
 *  - 합의(resolve): 노드마다 체인이 다를 때 "가장 길고 유효한 체인"을 정답으로 채택하는 규칙.
 *    (Longest Chain Rule. 비트코인의 기본 규칙과 같은 아이디어입니다.)
 *  - 다른 노드에 요청할 때는 Node 22 내장 fetch()를 쓰면 됩니다.
 */

/** 내가 아는 다른 노드들의 주소. 예: "http://localhost:3002" */
export const peers = new Set<string>();

/**
 * 피어 주소를 등록합니다. 중복과 자기 자신은 제외합니다.
 *
 * TODO(5단계):
 *  - 자기 자신(selfUrl)은 추가하지 않기
 *  - 반환: 현재 피어 목록 배열
 */
export function registerPeers(urls: string[], selfUrl: string): string[] {
  // TODO: 구현
  throw new Error("registerPeers: not implemented");
}

/**
 * 새 블록을 모든 피어에게 전파합니다. (POST {peer}/blocks/receive)
 *
 * TODO(5단계):
 *  - 피어마다 fetch로 블록을 보냅니다. 하나가 실패해도 나머지는 계속 보내야 합니다.
 *  - 힌트: Promise.allSettled 를 쓰면 실패를 모아서 처리하기 좋습니다.
 *  - 반환: 성공/실패한 피어 목록 (디버깅과 시각화에 유용)
 */
export async function broadcastBlock(
  block: Block,
): Promise<{ ok: string[]; failed: string[] }> {
  // TODO: 구현
  throw new Error("broadcastBlock: not implemented");
}

/**
 * 다른 노드가 보낸 블록을 받았을 때 처리합니다.
 *
 * TODO(5단계):
 *  - 받은 블록이 내 마지막 블록 바로 뒤에 붙을 수 있으면(prevHash == 내 latest.hash, index 일치, hash 유효)
 *    → 체인에 추가하고 "appended" 반환
 *  - 내 체인보다 훨씬 앞선 블록이면(index > latest.index + 1)
 *    → 내가 뒤처진 것이므로 "need-sync" 반환 (호출 측에서 resolveConflicts를 돌리면 됨)
 *  - 그 외(이미 있는 블록, 유효하지 않은 블록) → "rejected"
 *
 * 생각해 볼 것: 두 노드가 동시에 블록을 만들면 어떻게 될까요? (포크)
 */
export function receiveBlock(block: Block): "appended" | "need-sync" | "rejected" {
  // TODO: 구현
  throw new Error("receiveBlock: not implemented");
}

/**
 * 합의: 모든 피어의 체인을 가져와(GET {peer}/chain) 가장 길고 유효한 체인으로 교체합니다.
 *
 * TODO(5단계):
 *  1. 각 피어에 fetch → chain 배열 받기 (실패한 피어는 무시)
 *  2. 후보 중 validateChain(candidate).valid 이고 length가 내 chain보다 긴 것 중 가장 긴 것 선택
 *  3. 있으면 내 chain 내용을 교체(chain.length = 0; chain.push(...candidate)) 하고 replaced=true 반환
 *
 * 생각해 볼 것:
 *  - "더 긴 체인"이 아니라 "더 많은 작업이 들어간 체인"을 골라야 하는 경우가 있을까요? (난이도가 다를 때)
 *  - 유효하지 않은 긴 체인을 보낸 노드를 어떻게 다뤄야 할까요?
 */
export async function resolveConflicts(): Promise<{
  replaced: boolean;
  newLength: number;
  source: string | null;
}> {
  // TODO: 구현
  throw new Error("resolveConflicts: not implemented");
}

// 아래 세 줄은 아직 안 쓰는 import가 경고로 뜨지 않게 하는 임시 코드입니다. 구현하면서 지우세요.
void validateChain;
void chain;
void ({} as Chain);
