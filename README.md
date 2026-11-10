# AIM Block Chain — 블록체인 백엔드 적성 검증 미니 프로젝트

대학 진로탐색 공모전 활동의 일부로, **"블록체인 백엔드 개발이 나의 적성인가"** 라는 진로 가설을
직접 백엔드 작업을 해보며 검증하기 위한 프로젝트입니다. 완성도 높은 블록체인이 목표가 아니라,
작업 과정에서 기록한 **활동 일지 데이터**가 핵심 산출물입니다.

## 검증하려는 가설

- 초기 가설 (1주차, 확신도 7/10): 분산 시스템 구조에 흥미가 있으므로 블록체인 백엔드에 적합할 것이다.
- 수정 가설 (2주차, 확신도 4/10): 기획·프론트엔드 역량을 바탕으로 블록체인 서비스 분야에 적합하며,
  백엔드(분산 시스템) 적합성은 직접 경험으로 확인이 필요하다.
- 남은 질문
  1. 백엔드에 대한 관심은 적성인가, 호기심인가?
  2. 내가 흥미를 느낀 것은 "블록체인 자체"인가, "분산 구조(P2P)"인가?

## 구조

```
AIM-block-chain/
├── server/    A. TypeScript + Express 블록체인 API (포트 3001~3003 으로 여러 노드 실행)
├── web/       B. React + Vite 시각화 (블록 카드, 위변조, 채굴, 노드 동기화) + 활동 일지 대시보드
├── journal/   C. 활동 일지 CLI (입력, CSV 내보내기)
├── data/      activity-log.json (활동 일지 원본 데이터)
└── docs/      review-log.md (AI 리뷰 기록), findings.md (최종 분석)
```

```
[web :5173] ──HTTP──▶ [node :3001] ◀──전파/합의──▶ [node :3002] ◀──▶ [node :3003]
```

## 단계

| 단계 | 내용 | 일지 구분 |
|---|---|---|
| 1 | 블록 생성 + SHA-256 해시 + prevHash 연결 | 백엔드-블록체인 |
| 2 | 체인 유효성 검증 (깨진 블록 index 반환) | 백엔드-블록체인 |
| 3 | 작업증명 (난이도 조절) | 백엔드-블록체인 |
| 4 | 위변조 시뮬레이션 API | 백엔드-블록체인 |
| 5 | 멀티 노드 + 블록 전파 + 최장 유효 체인 채택 | 백엔드-분산네트워크 |
| 6 | 프론트엔드 시각화 | 프론트엔드 |

핵심 로직(해시, 체인 검증, 작업증명, 노드 동기화·합의, 시각화 로직)은 직접 작성했고,
AI는 튜터(개념 설명·TODO 힌트·코드 리뷰)와 보일러플레이트 작성 역할을 맡았습니다.
AI 정답을 참고한 부분은 [docs/review-log.md](docs/review-log.md)에 명시했습니다.

## 실행 방법

```bash
npm install

# 단일 노드
npm run server            # http://localhost:3001

# 멀티 노드 (터미널 3개)
npm run node1 ; npm run node2 ; npm run node3

# 프론트엔드
npm run web               # http://localhost:5173

# 서버 테스트
npm test -w server

# 활동 일지
npm run log                       # 작업 기록 추가
npm run log -- --confidence       # 주차별 확신도 입력
npm run log -- --list             # 목록
npm run log:csv                   # CSV 내보내기
```

## API

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | /chain | 전체 체인 |
| POST | /blocks | 블록 추가 `{ data, mine? }` |
| GET | /validate | 체인 검증 (깨진 index, 이유) |
| POST | /tamper/:index | 위변조 시뮬레이션 `{ data }` |
| GET/PUT | /difficulty | 난이도 조회/변경 |
| POST | /nodes/register | 피어 등록 `{ nodes: [] }` |
| POST | /blocks/receive | 전파된 블록 수신 |
| GET | /nodes/resolve | 합의 (최장 유효 체인 채택) |

## 단계별 결과 스크린샷

- [ ] 1단계: 블록 생성 결과 (`GET /chain`)
- [ ] 2단계: 검증 결과
- [ ] 3단계: 난이도별 채굴 시간
- [ ] 4단계: 위변조 후 빨간색 표시 화면
- [ ] 5단계: 노드 3개 동기화 화면
- [ ] 활동 일지 대시보드

## 결과

- [docs/review-log.md](docs/review-log.md) — AI 코드 리뷰 누적 기록
- [docs/findings.md](docs/findings.md) — 활동 일지 분석 및 결론
