/** 서버의 server/src/blockchain/types.ts 와 동일하게 유지 */
export interface Block {
  index: number;
  timestamp: number;
  data: string;
  prevHash: string;
  hash: string;
  nonce: number;
}

export interface ValidationResult {
  valid: boolean;
  brokenAt: number | null;
  reason: string | null;
}

export interface MineResult {
  block: Block;
  attempts: number;
  elapsedMs: number;
}

/** 활동 일지 (journal/src/types.ts 와 동일) */
export interface ActivityEntry {
  id: string;
  date: string;
  task: string;
  category: "백엔드-블록체인" | "백엔드-분산네트워크" | "프론트엔드";
  interest: number;
  focus: number;
  minutes: number;
  blockedAt: string;
  solvedBy: string;
  wantMore: number;
  note: string;
}

export interface ConfidenceEntry {
  week: number;
  confidence: number;
  note: string;
}

export interface ActivityLog {
  entries: ActivityEntry[];
  confidence: ConfidenceEntry[];
}
