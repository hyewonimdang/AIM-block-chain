/**
 * 블록체인 핵심 타입 정의
 *
 * 블록 하나가 가지는 필드:
 * - index     : 체인에서의 순서 (0 = 제네시스 블록)
 * - timestamp : 생성 시각 (ms, Date.now())
 * - data      : 블록에 담을 내용. 이 프로젝트에서는 아무 문자열이나 넣습니다.
 * - prevHash  : 바로 앞 블록의 hash. 이 값이 "연결(체인)"을 만듭니다.
 * - hash      : 위 필드들(+nonce)을 SHA-256으로 해싱한 값
 * - nonce     : 작업증명에서 조건을 만족할 때까지 바꿔보는 숫자 (3단계 전까지는 0)
 */
export interface Block {
  index: number;
  timestamp: number;
  data: string;
  prevHash: string;
  hash: string;
  nonce: number;
}

export type Chain = Block[];

/** 2단계: 검증 결과. 어느 블록에서 왜 깨졌는지까지 돌려줍니다. */
export interface ValidationResult {
  valid: boolean;
  /** 깨진 블록의 index. valid=true면 null */
  brokenAt: number | null;
  /** 사람이 읽을 수 있는 이유. 예: "hash mismatch", "prevHash mismatch" */
  reason: string | null;
}
