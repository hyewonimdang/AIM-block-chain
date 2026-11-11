# 시스템 구조

> README 에서 분리한 상세 구조 문서. 코드와 함께 읽는 용도.

## 폴더

```
AIM-block-chain/
├── server/    A. TypeScript + Express 블록체인 API (포트 3001~3003 으로 여러 노드 실행)
├── web/       B. React + Vite 시각화 (블록 카드, 위변조, 채굴, 노드 동기화) + 활동 일지 대시보드
├── journal/   C. 활동 일지 CLI (입력, CSV 내보내기)
├── data/      activity-log.json (활동 일지 원본 데이터)
└── docs/      findings, study-notes, review-log, study-guide, architecture, images/
```

## 전체 구성

```
┌────────────────────────────────────────────────────────────┐
│  브라우저  http://localhost:5173              (web/ React)   │
│  탭: 체인/위변조 │ 채굴 │ 노드 동기화 │ 활동 일지              │
└──────┬──────────────────┬───────────────────┬───────────────┘
       │ fetch            │ fetch             │ fetch
       ▼                  ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  노드 1      │◀──▶│  노드 2      │◀──▶│  노드 3      │  (server/ Express)
│  :3001      │    │  :3002      │    │  :3003      │  같은 코드를 포트만 다르게 3번 실행
│  chain[]    │    │  chain[]    │    │  chain[]    │  각 노드는 자기 메모리에 체인 보관
└─────────────┘    └─────────────┘    └─────────────┘
       ▲  노드끼리도 HTTP 로 통신 (블록 전파, 체인 조회)

┌────────────────────────────────────────────────────────────┐
│  터미널  npm run log                        (journal/ CLI)  │
│  → data/activity-log.json → 브라우저 "활동 일지" 탭이 읽음     │
└────────────────────────────────────────────────────────────┘
```

- **web**: 화면. 서버에 fetch 만 한다.
- **server**: 블록체인 본체. 상태는 `chain` 배열 하나이고 메모리에만 있다(DB 없음, 재시작 시 초기화). 포트를 바꿔 3번 실행하면 노드 3개가 된다.
- **journal**: 블록체인과 무관한 보고서용 기록 도구.

## 서버 내부

```
HTTP 요청
   │
   ▼
app.ts ── express.json(), cors
   │
   ├─ routes/chain.routes.ts            URL → 함수 연결만 담당
   │     GET  /chain       → chain 배열 응답
   │     POST /blocks      → pow.mineBlock → chain.push → nodes.broadcastBlock
   │     GET  /validate    → chain.validateChain
   │     POST /tamper/:i   → tamper.tamperBlock
   │
   └─ routes/nodes.routes.ts
         POST /nodes/register → nodes.registerPeers
         POST /blocks/receive → nodes.receiveBlock     (다른 노드가 보낸 블록)
         GET  /nodes/resolve  → nodes.resolveConflicts

blockchain/          단일 체인 로직 (1~4단계)
   block.ts    해시 계산, 제네시스/다음 블록 생성
   chain.ts    chain 배열(상태) + 검증
   pow.ts      작업증명(채굴)
   tamper.ts   위변조 실험
network/nodes.ts     노드 간 동기화 로직 (5단계)
```

## 요청 흐름 1: 블록 추가와 전파

```
[브라우저] "블록 추가"  →  POST :3001/blocks {data}
[노드 1]   mineBlock: nonce 를 0부터 올리며 hash 재계산, 앞자리 0 이 difficulty 개가 될 때까지
           chain.push(block)
           broadcastBlock: 피어마다 POST /blocks/receive
              ├─ [노드 2] receiveBlock: index·prevHash·hash·difficulty 검사 후 push
              └─ [노드 3] receiveBlock: 동일
[브라우저] 1.5초마다 세 노드에 GET /chain → 화면 갱신
```

## 요청 흐름 2: 위변조와 복구

```
[브라우저] 노드 2 "위변조"  →  POST :3002/tamper/1 {data:"evil"}
[노드 2]   chain[1].data 변경 (hash 는 그대로) → GET /validate 는 #1 "hash mismatch"

[브라우저] 노드 2 "resolve"  →  GET :3002/nodes/resolve
[노드 2]   피어마다 GET /chain 으로 체인 수집
           validateChain 통과 + (내 것보다 길거나, 내가 깨졌으면 같은 길이 이상) → 통째로 교체
```

## 블록 하나의 형태

```json
{
  "index": 1,
  "timestamp": 1794337431069,
  "data": "hello",
  "prevHash": "f463...6355",
  "hash": "0007...fb47",
  "nonce": 2183
}
```

- `prevHash`: 바로 앞 블록의 hash 를 복사한 값. 이 값이 블록들을 연결한다.
- `hash`: index, timestamp, data, prevHash, nonce 다섯 값을 SHA-256 한 결과. 내용이 바뀌면 달라진다.
- `nonce`: hash 앞자리가 `0` × difficulty 가 되도록 찾은 숫자. 2183 이면 2184번 시도했다는 뜻.

## API

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | /chain | 전체 체인 |
| POST | /blocks | 블록 추가 `{ data, mine? }` |
| GET | /validate | 체인 검증 (깨진 index, 이유). `?difficulty=0` 으로 작업증명 검사 생략 |
| POST | /tamper/:index | 위변조 시뮬레이션 `{ data, recompute? }` |
| GET/PUT | /difficulty | 난이도 조회/변경 |
| POST | /nodes/register | 피어 등록 `{ nodes: [] }` |
| POST | /blocks/receive | 전파된 블록 수신 |
| GET | /nodes/resolve | 합의 (최장 유효 체인 채택) |

