import type { Block, Chain, ValidationResult } from "./types.js";
import { calculateHash, createGenesisBlock } from "./block.js";
import { hashMeetsDifficulty, powConfig } from "./pow.js";

/**
 * ───────────────────────────────────────────────
 * 2단계: 체인 유효성 검증
 * ───────────────────────────────────────────────
 *
 * 이 파일은 "체인 전체"를 다루는 상태(state)와 함수를 모아둡니다.
 * 서버가 켜져 있는 동안 메모리에만 존재합니다. (DB 없음, 재시작하면 초기화)
 *
 * [학습 포인트]
 *  - 검증이란 "저장된 값"과 "지금 다시 계산한 값"을 비교하는 것입니다.
 *    hash 를 다시 계산해서 다르면 → 내용이 바뀐 것.
 *    prevHash 가 앞 블록 hash 와 다르면 → 연결이 끊긴 것.
 *  - 첫 번째로 깨진 블록에서 멈춥니다. 그 뒤의 블록들은 "그 자체로는 멀쩡해 보여도"
 *    깨진 블록 위에 쌓여 있으므로 신뢰할 수 없습니다. (프론트에서 그 이후를 전부 빨갛게 칠하는 이유)
 */

/** 서버 메모리에 있는 유일한 체인. 라우터와 network 모듈이 이 배열을 읽고 씁니다. */
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
 * 블록 하나가 "그 자체로" 올바른지 검사합니다. (저장된 hash == 다시 계산한 hash)
 * 체인 연결과는 무관합니다.
 */
export function isBlockHashValid(block: Block): boolean {
  const recomputed = calculateHash(
    block.index,
    block.timestamp,
    block.data,
    block.prevHash,
    block.nonce,
  );
  return recomputed === block.hash;
}

/**
 * 체인 전체를 검증합니다. 깨진 첫 번째 블록의 index와 이유를 반환합니다.
 *
 * @param target     검증할 체인. 매개변수로 받는 이유: 5단계에서 "다른 노드가 보낸 체인"도
 *                   같은 함수로 검증해야 하기 때문입니다.
 * @param difficulty 작업증명 조건. 0이면 검사하지 않습니다. (1·2단계 학습 시 0으로 호출)
 *
 * [검사 순서가 중요한 이유]
 *  index → prevHash → hash → difficulty 순으로 봅니다.
 *  위변조(data 수정)는 hash mismatch 로 걸리고, 그 다음 블록은 prevHash 는 맞지만
 *  "앞 블록이 이미 깨졌으므로" 거기까지 가지 않습니다. (첫 번째 실패에서 return)
 */
export function validateChain(
  target: Chain,
  difficulty: number = powConfig.difficulty,
): ValidationResult {
  if (target.length === 0) {
    return { valid: false, brokenAt: 0, reason: "empty chain" };
  }

  // 1) 제네시스는 "기대하는 제네시스"와 완전히 같아야 합니다.
  //    timestamp 가 고정값이라서 다시 만들어 비교할 수 있습니다.
  const expectedGenesis = createGenesisBlock();
  const genesis = target[0];
  if (
    genesis.index !== 0 ||
    genesis.hash !== expectedGenesis.hash ||
    genesis.prevHash !== expectedGenesis.prevHash
  ) {
    return { valid: false, brokenAt: 0, reason: "genesis mismatch" };
  }

  // 2) 1번부터 끝까지, 각 블록을 "앞 블록과의 관계" + "자기 자신" 두 가지로 검사
  for (let i = 1; i < target.length; i++) {
    const block = target[i];
    const prev = target[i - 1];

    if (block.index !== i) {
      return { valid: false, brokenAt: i, reason: "index mismatch" };
    }
    if (block.prevHash !== prev.hash) {
      return { valid: false, brokenAt: i, reason: "prevHash mismatch" };
    }
    if (!isBlockHashValid(block)) {
      return { valid: false, brokenAt: i, reason: "hash mismatch" };
    }
    if (!hashMeetsDifficulty(block.hash, difficulty)) {
      return { valid: false, brokenAt: i, reason: "difficulty not met" };
    }
  }

  return { valid: true, brokenAt: null, reason: null };
}

/**
 * [연습 2-2] 깨진 블록을 전부 찾습니다. (validateChain 과 달리 첫 실패에서 멈추지 않음)
 *
 * 반환 예: [{ index: 2, reason: "hash mismatch" }, { index: 3, reason: "prevHash mismatch" }]
 *
 * TODO:
 *  - validateChain 의 for 루프를 참고해서, return 대신 배열에 push 하고 계속 진행
 *  - 블록 하나에 여러 문제가 있으면 첫 번째 이유만 넣어도 됨
 *  - 제네시스 검사는 생략해도 됨 (1번부터)
 */
export function findAllBroken(
  target: Chain,
  difficulty: number = powConfig.difficulty,
): { index: number; reason: string }[] {
  const broken: { index: number; reason: string }[] = [];

  for (let i = 1; i < target.length; i++) {
    const block = target[i];
    const prev = target[i - 1];

    // validateChain 과 같은 검사. return 대신 push + continue 로 "다음 블록으로" 넘어간다.
    if (block.index !== i) {
      broken.push({ index: i, reason: "index mismatch" });
      continue;
    }
    if (block.prevHash !== prev.hash) {
      broken.push({ index: i, reason: "prevHash mismatch" });
      continue;
    }
    if (!isBlockHashValid(block)) {
      broken.push({ index: i, reason: "hash mismatch" });
      continue;
    }
    if (!hashMeetsDifficulty(block.hash, difficulty)) {
      broken.push({ index: i, reason: "difficulty not met" });
    }
  }

  return broken;
}

/** 체인 내용을 통째로 교체합니다. 5단계 합의(resolve)에서 사용합니다. */
export function replaceChain(next: Chain): void {
  chain.length = 0;
  chain.push(...next);
}
