/** 활동 일지 한 건 */
export interface ActivityEntry {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  task: string;
  category: Category;
  interest: Rating; // 흥미도
  focus: Rating; // 몰입도
  minutes: number; // 소요 시간(분)
  blockedAt: string; // 막힌 지점
  solvedBy: string; // 해결 방법
  wantMore: Rating; // 추가 학습 의향
  note: string; // 한 줄 소감
}

export const CATEGORIES = [
  "백엔드-블록체인",
  "백엔드-분산네트워크",
  "프론트엔드",
] as const;
export type Category = (typeof CATEGORIES)[number];

export type Rating = 1 | 2 | 3 | 4 | 5;

/** 진로 가설 확신도 (주차별) */
export interface ConfidenceEntry {
  week: number;
  /** 0 ~ 10 */
  confidence: number;
  note: string;
}

export interface ActivityLog {
  entries: ActivityEntry[];
  confidence: ConfidenceEntry[];
}
