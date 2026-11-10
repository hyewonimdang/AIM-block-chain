import type { Block } from "./types.js";
import { calculateHash } from "./block.js";

/**
 * ───────────────────────────────────────────────
 * 3단계: 작업증명 (Proof of Work)
 * ───────────────────────────────────────────────
 *
 * 개념:
 *  - "hash가 특정 조건을 만족할 때까지 nonce를 바꿔가며 반복 계산"하는 것이 작업증명입니다.
 *  - 조건: hash 문자열이 '0'으로 difficulty개 시작해야 함. (예: difficulty=3 → "000abc...")
 *  - 해시는 예측 불가능하므로 조건을 만족하는 nonce는 "찾는" 수밖에 없고, 그래서 시간이 듭니다.
 *  - difficulty가 1 올라갈 때마다 평균 시도 횟수는 16배(hex 한 자리) 늘어납니다.
 *  - 검증하는 쪽은 hash 앞자리만 보면 되므로 빠릅니다. (찾기는 어렵고 확인은 쉬움)
 */

/** 서버 전체 난이도. 라우터에서 바꿀 수 있게 객체로 둡니다. */
export const powConfig = { difficulty: 3 };

/** hash가 difficulty 조건을 만족하는지 */
export function hashMeetsDifficulty(hash: string, difficulty: number): boolean {
  // TODO(3단계): hash가 '0' × difficulty 로 시작하는지 반환
  throw new Error("hashMeetsDifficulty: not implemented");
}

/** 채굴 결과: 블록 + 몇 번 시도했는지 + 걸린 시간 (프론트 시각화와 일지용) */
export interface MineResult {
  block: Block;
  attempts: number;
  elapsedMs: number;
}

/**
 * 조건을 만족하는 nonce를 찾아 새 블록을 만듭니다.
 *
 * TODO(3단계):
 *  1. index, prevHash, timestamp 를 정하고 nonce = 0 에서 시작
 *  2. 반복: hash = calculateHash(..., nonce) → hashMeetsDifficulty 통과하면 종료, 아니면 nonce++
 *  3. attempts(시도 횟수)와 elapsedMs(performance.now() 차이)를 함께 반환
 *
 * 선택 과제:
 *  - onProgress 콜백으로 "현재 nonce, 현재 hash"를 주기적으로(예: 1000번마다) 알려주면
 *    프론트엔드에서 nonce 증가 과정을 보여줄 수 있습니다. (SSE 또는 polling)
 */
export function mineBlock(
  prevBlock: Block,
  data: string,
  difficulty: number = powConfig.difficulty,
  onProgress?: (nonce: number, hash: string) => void,
): MineResult {
  // TODO: 구현
  throw new Error("mineBlock: not implemented");
}
