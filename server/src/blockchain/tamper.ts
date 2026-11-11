import type { Block } from "./types.js";
import { calculateHash } from "./block.js";
import { chain } from "./chain.js";

/**
 * ───────────────────────────────────────────────
 * 4단계: 위변조 시뮬레이션
 * ───────────────────────────────────────────────
 *
 * [학습 포인트]
 *  실험 1 (recompute=false): data 만 몰래 바꾼다.
 *    → 그 블록의 hash 가 내용과 안 맞음 → "hash mismatch" 로 즉시 발각.
 *
 *  실험 2 (recompute=true): data 를 바꾸고 hash 도 다시 계산해서 "그럴듯하게" 맞춘다.
 *    → 그 블록 자체는 멀쩡해 보임. 하지만 다음 블록의 prevHash 가 옛날 hash 를 가리키고 있음
 *    → 다음 블록에서 "prevHash mismatch" 로 발각.
 *    → 완전히 속이려면 그 뒤 블록을 전부 다시 만들어야 하고(= 전부 다시 채굴),
 *      3단계의 작업증명 때문에 그 비용이 커집니다. 이것이 블록체인이 "불변"이라고 불리는 이유입니다.
 *
 *  실험 3 (recompute=true + difficulty>0): hash 를 다시 계산해도 앞자리 0 조건을 못 맞추므로
 *    "difficulty not met" 으로도 걸립니다. 다시 채굴(mineBlock)까지 해야 속일 수 있습니다.
 */

export interface TamperOptions {
  /** true 면 data 변경 후 hash 를 다시 계산합니다. (실험 2) 기본 false (실험 1) */
  recompute?: boolean;
}

/**
 * index 번 블록의 data 를 바꿉니다. 범위 밖이면 null.
 * 제네시스(0번)도 바꿀 수 있게 두었습니다. → 검증 시 "genesis mismatch" 가 나오는 것을 볼 수 있습니다.
 */
export function tamperBlock(
  index: number,
  newData: string,
  options: TamperOptions = {},
): Block | null {
  const block = chain[index];
  if (!block) return null;

  block.data = newData;

  if (options.recompute) {
    block.hash = calculateHash(
      block.index,
      block.timestamp,
      block.data,
      block.prevHash,
      block.nonce,
    );
  }

  return block;
}
