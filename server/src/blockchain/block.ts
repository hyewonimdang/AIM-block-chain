import { createHash } from "node:crypto";
import type { Block } from "./types.js";

/**
 * ───────────────────────────────────────────────
 * 1단계: 블록 생성 + SHA-256 해시 + prevHash 연결
 * ───────────────────────────────────────────────
 *
 * [학습 포인트]
 *  - 해시 함수는 "입력이 1비트만 달라져도 출력이 완전히 달라지는" 일방향 함수입니다.
 *    같은 입력 → 항상 같은 출력. 출력에서 입력을 역산할 수는 없습니다.
 *  - 블록의 hash는 블록 내용 전부(index, timestamp, data, prevHash, nonce)로 계산합니다.
 *    → 내용 하나라도 바뀌면 hash가 달라지고, 다음 블록의 prevHash와 안 맞게 됩니다.
 *  - Node.js 내장 모듈 `node:crypto` 를 쓰므로 외부 패키지가 필요 없습니다.
 */

/** 제네시스 블록의 prevHash. "앞 블록이 없다"는 뜻으로 0을 64개 채웁니다. */
export const GENESIS_PREV_HASH = "0".repeat(64);

/**
 * 제네시스 timestamp는 고정값입니다.
 * Date.now()를 쓰면 서버를 켤 때마다 제네시스가 달라지고,
 * 5단계에서 노드 3개의 체인이 "서로 다른 체인"으로 취급됩니다.
 */
export const GENESIS_TIMESTAMP = 1_700_000_000_000;

/**
 * 블록 필드들로부터 SHA-256 해시(hex 64자)를 계산합니다.
 *
 * [왜 JSON.stringify(배열)인가]
 *  - 그냥 이어 붙이면 ("1" + "23") 과 ("12" + "3") 이 같은 문자열이 됩니다. 구분이 필요합니다.
 *  - JSON.stringify는 문자열에 따옴표, 숫자는 그대로, 사이에 쉼표를 넣어 주므로 경계가 명확합니다.
 *  - 가장 중요한 것은 "검증할 때 똑같은 방식으로 다시 계산할 수 있어야 한다"는 점입니다.
 *    브라우저(web/src/lib/hash.ts)에서도 같은 형식을 써서 서버와 동일한 해시를 얻습니다.
 */
export function calculateHash(
  index: number,
  timestamp: number,
  data: string,
  prevHash: string,
  nonce: number,
): string {
  const payload = JSON.stringify([index, timestamp, data, prevHash, nonce]);
  return createHash("sha256").update(payload).digest("hex");
}

/** 체인의 첫 번째 블록(제네시스). 모든 노드에서 완전히 동일해야 합니다. */
export function createGenesisBlock(): Block {
  const index = 0;
  const timestamp = GENESIS_TIMESTAMP;
  const data = "genesis";
  const prevHash = GENESIS_PREV_HASH;
  const nonce = 0;
  return {
    index,
    timestamp,
    data,
    prevHash,
    hash: calculateHash(index, timestamp, data, prevHash, nonce),
    nonce,
  };
}

/**
 * 이전 블록 뒤에 붙을 새 블록을 만듭니다. (작업증명 없음, nonce = 0)
 * 3단계부터는 이 함수 대신 pow.ts 의 mineBlock 을 씁니다.
 *
 * [연결의 핵심] prevHash = prevBlock.hash
 *  이 한 줄이 "체인"을 만듭니다. 이전 블록이 바뀌면 그 hash가 바뀌고,
 *  여기 저장된 prevHash 와 달라져서 연결이 끊긴 것을 알 수 있습니다.
 */
export function createNextBlock(prevBlock: Block, data: string): Block {
  const index = prevBlock.index + 1;
  const timestamp = Date.now();
  const prevHash = prevBlock.hash;
  const nonce = 0;
  return {
    index,
    timestamp,
    data,
    prevHash,
    hash: calculateHash(index, timestamp, data, prevHash, nonce),
    nonce,
  };
}
