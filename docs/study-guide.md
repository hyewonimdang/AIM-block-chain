# 학습 가이드 (코드 읽는 순서 + 직접 해볼 연습 문제)

이 프로젝트의 핵심 로직은 AI(튜터)가 시범 구현했고, 나는 코드를 읽고 아래 연습 문제를 직접 풀며 학습했다.
각 단계를 마칠 때마다 `npm run log` 로 활동 일지를 기록한다. (구분은 단계별로 표시)

읽기 전에 켜 둘 것:

```bash
npm run server         # 터미널 1
cd server && npx vitest # 터미널 2: 파일을 고치면 테스트가 자동으로 다시 돈다
```

---

## 1단계 · 블록 생성 + SHA-256 + prevHash 연결   `[백엔드-블록체인]`

읽을 파일: `server/src/blockchain/types.ts` → `block.ts` → `block.test.ts`

핵심 개념
- 해시 = 입력이 조금만 달라도 완전히 다른 출력이 나오는 일방향 함수.
- 블록의 hash 는 블록 내용 전부로 계산한다. 그래서 내용이 바뀌면 hash 가 바뀐다.
- `prevHash = 이전 블록.hash` 한 줄이 체인을 만든다.

연습 문제
1. `calculateHash` 에서 `JSON.stringify([...])` 를 그냥 `"" + index + timestamp + ...` 로 바꿔 보자.
   테스트는 통과하는가? 그런데 `calculateHash(1, 23, ...)` 과 `calculateHash(12, 3, ...)` 은 어떻게 되는가?
   (직접 node 로 찍어 보기: `cd server && npx tsx -e "import {calculateHash as h} from './src/blockchain/block.ts'; console.log(h(1,23,'a','b',0)===h(12,3,'a','b',0))"`)
2. `GENESIS_TIMESTAMP` 를 `Date.now()` 로 바꾸면 어떤 테스트가 깨지는가? 5단계에서는 어떤 문제가 생길까?
3. 터미널에서 블록을 3개 추가하고 `GET /chain` 으로 prevHash → hash 연결을 눈으로 확인하자.

```bash
curl -X POST localhost:3001/blocks -H "Content-Type: application/json" -d "{\"data\":\"first\",\"mine\":false}"
curl localhost:3001/chain
```

---

## 2단계 · 체인 검증   `[백엔드-블록체인]`

읽을 파일: `chain.ts` (validateChain) → `chain.test.ts` 의 "2단계" 블록

핵심 개념
- 검증 = "저장된 값" 과 "다시 계산한 값" 비교.
- 첫 번째로 깨진 블록에서 멈춘다. 그 뒤는 검증되지 않은 영역.

연습 문제
1. `validateChain` 의 검사 순서(index → prevHash → hash → difficulty)를 바꾸면 테스트가 깨지는가? 어떤 테스트가, 왜?
2. 깨진 블록 "하나만" 이 아니라 "깨진 블록 전부" 를 배열로 돌려주는 `findAllBroken(chain)` 을 새로 만들어 보자.
   (힌트: return 대신 배열에 push 하고 계속 진행) 결과가 validateChain 과 다르게 나오는 경우는?
3. `GET /validate?difficulty=0` 과 `GET /validate` 의 결과가 다른 상황을 만들어 보자. (mine=false 로 블록 추가)

---

## 3단계 · 작업증명   `[백엔드-블록체인]`

읽을 파일: `pow.ts` → `pow.test.ts` → 프론트 "채굴" 탭에서 난이도 1~5 비교

핵심 개념
- 조건(앞자리 0 × difficulty)을 만족할 때까지 nonce 를 바꿔가며 반복 계산.
- 난이도 +1 마다 평균 시도 횟수 ×16. 찾기는 어렵고 확인은 쉽다.

연습 문제
1. 난이도 1~5 로 각각 3번씩 서버 채굴을 하고 시도 횟수 평균을 표로 적어 보자. 16배 규칙이 맞는가? 왜 편차가 큰가?
2. `mineBlock` 에서 timestamp 를 루프 안에서 매번 `Date.now()` 로 갱신하면 어떤 문제가 생기는가? (힌트: 검증 쪽에서 다시 계산)
3. 난이도 6 으로 채굴하면 서버가 몇 초나 멈추는가? 이 동안 `GET /chain` 요청은 어떻게 되는가? (Node 는 싱글 스레드라는 점과 연결해 생각)

---

## 4단계 · 위변조 시뮬레이션   `[백엔드-블록체인]`

읽을 파일: `tamper.ts` → `chain.test.ts` 의 "4단계" 블록 → 프론트 "체인 / 위변조" 탭

핵심 개념
- data 만 바꾸면 hash mismatch 로 즉시 발각.
- hash 까지 다시 계산하면 그 블록은 멀쩡해 보이지만, 다음 블록의 prevHash 에서 발각.
- 완전히 속이려면 뒤 블록을 전부 다시 채굴해야 한다 → 작업증명이 비용을 만든다.

연습 문제
1. 프론트에서 중간 블록을 "hash 재계산" 으로 위변조해 보자. 어느 블록이 빨갛게 되는가? 프론트의 `isBroken` 함수와 서버 `brokenAt` 의 관계를 설명해 보자.
2. 마지막 블록을 hash 재계산으로 위변조하면 difficulty 0 에서는 검증을 통과한다. 이것이 "확정(confirmation) 수" 개념과 어떻게 이어지는지 한 줄로 적어 보자.

---

## 5단계 · 분산 네트워크   `[백엔드-분산네트워크]`

읽을 파일: `network/nodes.ts` → `nodes.test.ts` → `routes/nodes.routes.ts` → 프론트 "노드 동기화" 탭

핵심 개념
- 중앙 서버 없이 "규칙" 으로 정답을 정한다 → 가장 길고 유효한 체인.
- 상대는 꺼져 있을 수 있고(allSettled), 거짓말할 수 있고(validateChain), 동시에 블록을 만들 수 있다(포크).
- 통합 테스트에서 발견한 버그: 위변조된 노드가 길이는 같아서 복구가 안 됐다 → 규칙 2 에 예외 추가. (nodes.ts 주석)

연습 문제
1. 노드 3 을 끄고 노드 1 에서 블록 추가 → `broadcast.failed` 확인 → 노드 3 켜고 resolve. 로그를 적어 보자.
2. 포크를 만들어 보자: 피어 등록 전에 노드 1 과 노드 2 에서 각각 블록을 추가한 뒤 피어 등록 → 노드 1 에서 블록 하나 더 추가 → 노드 2 는 어떤 상태인가? (`need-sync` 경로가 타는지 서버 로그/응답으로 확인)

---

---

## 단계별 활동 일지 기록 요령

- 작업명 예: "1단계 코드 분석 + 연습 1~3"
- 막힌 지점은 "이해가 안 된 개념" 도 포함한다. (예: "allSettled 와 all 의 차이가 처음엔 헷갈림")
- 흥미도와 몰입도를 솔직하게. 낮게 나온 단계가 오히려 중요한 데이터다.
- 3·4주차 확신도: `npm run log:confidence`
