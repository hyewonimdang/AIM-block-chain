import { createHash } from "node:crypto";
import type { Block } from "./types.js";

/**
 * ───────────────────────────────────────────────
 * 1단계: 블록 생성 + SHA-256 해시 + prevHash 연결
 * ───────────────────────────────────────────────
 *
 * 개념:
 *  - 해시 함수는 "입력이 1비트만 달라져도 출력이 완전히 달라지는" 일방향 함수입니다.
 *  - 블록의 hash는 블록 내용(index, timestamp, data, prevHash, nonce)을 전부 넣고 계산합니다.
 *    → 내용 중 하나라도 바뀌면 hash가 달라지고, 다음 블록의 prevHash와 안 맞게 됩니다.
 *  - Node.js 내장 모듈 `node:crypto`의 createHash("sha256")를 사용합니다.
 *    사용법 힌트: createHash("sha256").update(문자열).digest("hex")
 */

/** 제네시스 블록의 prevHash로 쓸 고정값 */
export const GENESIS_PREV_HASH = "0".repeat(64);

/**
 * 블록 필드들로부터 SHA-256 해시 문자열(hex, 64자)을 계산합니다.
 *
 * TODO(1단계):
 *  1. index, timestamp, data, prevHash, nonce를 하나의 문자열로 합치세요.
 *     - 힌트: 구분자 없이 그냥 이어 붙이면 "1" + "23" 과 "12" + "3" 이 같아지는 문제가 있습니다.
 *       구분자를 넣거나 JSON.stringify를 쓰는 것을 고려해 보세요.
 *     - 중요: 순서와 형식이 항상 동일해야 합니다. (검증할 때 똑같이 다시 계산하기 때문)
 *  2. createHash("sha256")로 해싱하고 hex 문자열로 반환하세요.
 */
export function calculateHash(
  index: number,
  timestamp: number,
  data: string,
  prevHash: string,
  nonce: number,
): string {
  // TODO: 구현
  throw new Error("calculateHash: not implemented");
}

/**
 * 체인의 첫 번째 블록(제네시스)을 만듭니다.
 *
 * TODO(1단계):
 *  - index 0, prevHash는 GENESIS_PREV_HASH, nonce 0, data는 자유 ("genesis" 등)
 *  - hash는 calculateHash로 계산해서 채우세요.
 *  - 힌트: timestamp를 Date.now()로 하면 서버를 켤 때마다 제네시스가 달라집니다.
 *    5단계(노드 동기화)에서는 모든 노드의 제네시스가 같아야 하므로, 고정값을 쓰는 것이 좋습니다.
 */
export function createGenesisBlock(): Block {
  // TODO: 구현
  throw new Error("createGenesisBlock: not implemented");
}

/**
 * 이전 블록 뒤에 붙을 새 블록을 만듭니다. (아직 작업증명 없음, nonce = 0)
 *
 * TODO(1단계):
 *  - index = prevBlock.index + 1
 *  - prevHash = prevBlock.hash
 *  - timestamp = Date.now()
 *  - hash = calculateHash(...)
 *
 * 3단계에서는 이 함수 대신 pow.ts의 mineBlock을 쓰게 됩니다.
 */
export function createNextBlock(prevBlock: Block, data: string): Block {
  // TODO: 구현
  throw new Error("createNextBlock: not implemented");
}
