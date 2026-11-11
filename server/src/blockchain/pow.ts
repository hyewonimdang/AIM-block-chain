import type { Block } from "./types.js";
import { calculateHash } from "./block.js";

/**
 * ───────────────────────────────────────────────
 * 3단계: 작업증명 (Proof of Work)
 * ───────────────────────────────────────────────
 *
 * [학습 포인트]
 *  - "hash가 특정 조건을 만족할 때까지 nonce를 바꿔가며 반복 계산"하는 것이 작업증명입니다.
 *  - 조건: hash 문자열이 '0'으로 difficulty개 시작. (difficulty=3 → "000abc...")
 *  - 해시는 예측 불가능하므로 조건을 만족하는 nonce는 "찾는" 수밖에 없고, 그래서 시간이 듭니다.
 *  - hex 한 자리는 16가지이므로 difficulty가 1 오르면 평균 시도 횟수가 약 16배 늘어납니다.
 *    difficulty 3 → 평균 4,096번, 4 → 65,536번, 5 → 약 100만 번.
 *  - 검증은 hash 앞자리만 보면 되므로 즉시 끝납니다. "찾기는 어렵고 확인은 쉽다"가 핵심입니다.
 *  - 왜 필요한가: 블록을 만드는 데 비용이 들게 해서, 위변조한 뒤 체인을 다시 만드는 것을
 *    현실적으로 불가능하게 만들기 위해서입니다. (4단계 위변조 실험과 연결)
 */

/** 서버 전체 난이도. 라우터에서 바꿀 수 있게 객체(참조)로 둡니다. */
export const powConfig = { difficulty: 3 };

/** hash가 difficulty 조건을 만족하는지. difficulty 0이면 항상 true. */
export function hashMeetsDifficulty(hash: string, difficulty: number): boolean {
  return hash.startsWith("0".repeat(difficulty));
}

/** 채굴 결과: 블록 + 시도 횟수 + 걸린 시간 (프론트 시각화와 활동 일지용) */
export interface MineResult {
  block: Block;
  attempts: number;
  elapsedMs: number;
}

/**
 * 조건을 만족하는 nonce를 찾아 새 블록을 만듭니다.
 *
 * [구조]
 *  1. nonce 를 0 부터 시작
 *  2. hash 계산 → 조건 통과하면 종료, 아니면 nonce++ 후 반복
 *  3. timestamp 는 시작 시점에 한 번만 정합니다. 반복 중에 바꾸면 hash 입력이 계속 변해서
 *     "같은 입력으로 다시 계산" 하는 검증이 깨집니다.
 *
 * [onProgress]
 *  1000번마다 현재 nonce/hash 를 알려주는 콜백. 서버 로그나 SSE 스트리밍에 쓸 수 있습니다.
 *  (이번 프로젝트의 프론트 채굴 시각화는 브라우저에서 같은 로직을 직접 돌려 보여줍니다.)
 */
export function mineBlock(
  prevBlock: Block,
  data: string,
  difficulty: number = powConfig.difficulty,
  onProgress?: (nonce: number, hash: string) => void,
): MineResult {
  const index = prevBlock.index + 1;
  const prevHash = prevBlock.hash;
  const timestamp = Date.now();
  const started = performance.now();

  let nonce = 0;
  let hash = calculateHash(index, timestamp, data, prevHash, nonce);

  while (!hashMeetsDifficulty(hash, difficulty)) {
    nonce += 1;
    hash = calculateHash(index, timestamp, data, prevHash, nonce);
    if (onProgress && nonce % 1000 === 0) onProgress(nonce, hash);
  }

  return {
    block: { index, timestamp, data, prevHash, hash, nonce },
    attempts: nonce + 1,
    elapsedMs: Math.round((performance.now() - started) * 100) / 100,
  };
}
