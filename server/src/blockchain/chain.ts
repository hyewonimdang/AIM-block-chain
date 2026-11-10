import type { Block, Chain, ValidationResult } from "./types.js";
import { calculateHash, createGenesisBlock } from "./block.js";

/**
 * ───────────────────────────────────────────────
 * 2단계: 체인 유효성 검증   /   4단계: 위변조 시뮬레이션
 * ───────────────────────────────────────────────
 *
 * 이 파일은 "체인 전체"를 다루는 상태(state)와 함수를 모아둡니다.
 * 서버가 켜져 있는 동안 메모리에만 존재합니다. (DB 없음, 재시작하면 초기화)
 */

/** 서버 메모리에 있는 유일한 체인. 라우터에서 이 배열을 읽고 씁니다. */
export const chain: Chain = [];

/** 서버 시작 시 1번 호출. 제네시스 블록으로 초기화합니다. */
export function initChain(): void {
  chain.length = 0;
  chain.push(createGenesisBlock());
}

export function getLatestBlock(): Block {
  return chain[chain.length - 1];
}

/**
 * 블록 하나가 "그 자체로" 올바른지 검사합니다.
 * (체인 연결과 무관하게, 저장된 hash가 내용과 일치하는지)
 *
 * TODO(2단계):
 *  - calculateHash로 다시 계산한 값과 block.hash를 비교하세요.
 *  - 3단계 이후: hash가 difficulty 조건(앞자리 0 개수)을 만족하는지도 여기서 검사하면 좋습니다.
 */
export function isBlockHashValid(block: Block): boolean {
  // TODO: 구현
  throw new Error("isBlockHashValid: not implemented");
}

/**
 * 체인 전체를 검증합니다. 깨진 첫 번째 블록의 index와 이유를 반환합니다.
 *
 * TODO(2단계):
 *  1. 0번 블록(제네시스)이 기대하는 제네시스와 같은지 확인하세요.
 *     - 힌트: createGenesisBlock()을 다시 만들어 hash를 비교하면 됩니다. (제네시스 timestamp가 고정값이어야 가능)
 *  2. 1번부터 끝까지 순회하며 각 블록에 대해:
 *     a. isBlockHashValid(block) 이 false면 → brokenAt = i, reason = "hash mismatch"
 *     b. block.prevHash !== 이전 블록.hash 이면 → brokenAt = i, reason = "prevHash mismatch"
 *     c. block.index !== i 이면 → reason = "index mismatch"
 *  3. 모두 통과하면 { valid: true, brokenAt: null, reason: null }
 *
 * 생각해 볼 것:
 *  - 3번 블록의 data를 바꾸면 3번만 깨질까요, 4번도 깨질까요? 왜? (프론트에서 빨간색 범위를 정할 때 중요)
 *  - 매개변수로 체인을 받는 이유: 5단계에서 "다른 노드가 보낸 체인"도 같은 함수로 검증해야 하기 때문입니다.
 */
export function validateChain(target: Chain): ValidationResult {
  // TODO: 구현
  throw new Error("validateChain: not implemented");
}

/**
 * 위변조 시뮬레이션: index번 블록의 data를 바꾸되, hash는 다시 계산하지 **않습니다**.
 * (해커가 내용만 몰래 바꾼 상황을 흉내)
 *
 * TODO(4단계):
 *  - 범위 밖 index면 null 반환
 *  - 제네시스(0번)도 변조 가능하게 둘지 결정하세요.
 *  - 변조 후 validateChain(chain)을 호출하면 어느 블록에서 깨지는지 확인할 수 있습니다.
 *
 * 추가 실험(선택): "data를 바꾸고 hash까지 다시 계산"하는 옵션을 만들어 보세요.
 *  → 그래도 다음 블록의 prevHash 때문에 검증이 실패합니다. 이게 체인 구조의 핵심입니다.
 */
export function tamperBlock(index: number, newData: string): Block | null {
  // TODO: 구현
  throw new Error("tamperBlock: not implemented");
}
