# AI 코드 리뷰 누적 기록

> 형식: 날짜 / 단계 / [잘한 점 · 버그·위험 · 개선 제안 · 다음에 공부할 개념] / 수정 결과
> 구분 표시
> - **내가 구현**: 직접 작성한 코드에 대한 AI 리뷰
> - **AI 구현 (학습용)**: AI가 튜터로서 시범 구현하고, 나는 코드를 읽고 연습 문제를 풀며 학습
> - **AI 정답 참고**: 3회 이상 막힌 뒤 명시적으로 정답을 요청해 참고한 부분

---

## 2026-11-10 · 0단계 세팅

- AI가 작성: 모노레포 구조, Express 라우터 뼈대, 핵심 로직 파일의 타입·시그니처·TODO, 활동 일지 CLI, 문서 틀
- 내가 작성: (없음)

---

## 2026-11-11 · 진행 방식 변경

원래 계획은 핵심 로직(해시, 검증, 작업증명, 노드 동기화)을 직접 구현하고 AI는 힌트와 리뷰만 하는 것이었다.
1단계 시작 시점에 전체 소요 기간(2~3주)을 확인한 뒤, **AI가 튜터로서 전체를 시범 구현하고 나는 코드를 분석하며
연습 문제(docs/study-guide.md)를 직접 푸는 방식**으로 변경했다.

이에 따라 아래 1~5단계의 구현 코드와 프론트엔드 시각화는 AI 구현으로 진행하였으며, 활동 일지에는 "코드 분석 + 연습 문제" 작업을 기록한다.
연습 문제를 풀며 추가·수정한 코드는 별도 커밋(`study(...)`)으로 남기고, 그에 대한 리뷰를 이 문서에 이어서 기록한다.

---

## 2026-11-11 · 1~5단계 백엔드 — AI 구현 (학습용)

### 구현 내용
- 1단계 `block.ts`: calculateHash(JSON.stringify 배열 방식), 고정 timestamp 제네시스, createNextBlock
- 2단계 `chain.ts`: validateChain(index → prevHash → hash → difficulty 순 검사, 첫 실패에서 중단), replaceChain
- 3단계 `pow.ts`: hashMeetsDifficulty, mineBlock(attempts·elapsedMs·onProgress)
- 4단계 `tamper.ts`: data 변경 / hash 재계산 옵션
- 5단계 `network/nodes.ts`: registerPeers, broadcastBlock(allSettled, 2초 timeout), receiveBlock(appended / need-sync / rejected), resolveConflicts
- 테스트 28개 (`npm test -w server`), 노드 3개 실제 HTTP 통합 테스트 수행

### AI 스스로 리뷰 (학습자가 같은 관점으로 코드를 볼 수 있도록)

**잘한 점**
- 검증 함수가 체인을 매개변수로 받아 "내 체인" 과 "남이 보낸 체인" 을 같은 코드로 검증한다.
- 외부 입력(다른 노드가 보낸 JSON)은 `isBlockShape` 로 모양을 검사한 뒤에만 사용한다.
- 네트워크 실패를 예외가 아니라 결과값(`failed[]`, `length: null`)으로 다뤄 한 노드가 꺼져도 흐름이 멈추지 않는다.

**버그·위험 (통합 테스트에서 발견)**
- **resolve 가 위변조된 노드를 복구하지 못함.** 1번 블록의 data 만 바꾸면 마지막 블록 hash 는 그대로라 새 블록을 계속 수신하고,
  길이가 다른 노드와 같아져 "더 긴 체인만 채택" 규칙에 걸리지 않았다.
  → 수정: 내 체인이 유효하지 않으면 같은 길이의 유효한 체인도 채택 (`nodes.ts` 규칙 2 예외, 테스트 추가)
- `mineBlock` 은 동기 루프라 난이도 6 이상이면 서버 전체가 수 초 멈춘다. (싱글 스레드) 학습용으로는 의도적으로 남겨 둠.
- `receiveBlock` 은 포크(같은 index, 다른 prevHash)를 rejected 로만 처리하고 기억하지 않는다. 실제 시스템은 고아 블록을 보관한다.

**개선 제안**
- 길이 대신 누적 작업량(chainwork)으로 비교
- 위변조 후 재채굴 옵션

**다음에 공부할 개념**
- Node.js 이벤트 루프와 CPU 바운드 작업 (worker_threads)
- Promise.all vs allSettled, AbortSignal.timeout
- 비트코인의 chainwork, 고아 블록, 확정 수(confirmations)

---

## (이후 내가 작성한 코드에 대한 리뷰를 여기에 추가)

---

## 2026-11-11 · 연습 2-2 findAllBroken — AI 코드 참고

- 포인트: `return` 을 `push + continue` 로 바꾸면 "첫 실패에서 멈춤" 이 "전부 수집" 이 된다. hash 를 재계산한 2번 블록은 자기 자신은 유효해 결과에 안 잡히고, 3번이 prevHash mismatch 로 잡힌다.

