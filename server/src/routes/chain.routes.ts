import { Router } from "express";
import { chain, validateChain, tamperBlock, getLatestBlock } from "../blockchain/chain.js";
import { createNextBlock } from "../blockchain/block.js";
import { mineBlock, powConfig } from "../blockchain/pow.js";

/**
 * 블록체인 API 라우터 (보일러플레이트)
 *
 * Express 기초:
 *  - router.get(경로, (req, res) => {...})  → GET 요청 처리
 *  - req.params.index  → URL의 :index 부분
 *  - req.body          → JSON 본문 (app.ts에서 express.json() 미들웨어를 등록해야 파싱됨)
 *  - res.status(400).json({...}) → 상태코드 + JSON 응답
 */
export const chainRouter = Router();

/** GET /chain — 전체 체인 */
chainRouter.get("/chain", (_req, res) => {
  res.json({ length: chain.length, chain });
});

/** GET /chain/latest — 마지막 블록 */
chainRouter.get("/chain/latest", (_req, res) => {
  res.json(getLatestBlock());
});

/**
 * POST /blocks  body: { data: string, mine?: boolean }
 *  - 1단계: mine=false 로 호출하면 createNextBlock 사용 (작업증명 없음)
 *  - 3단계 이후: mine 생략(기본) 또는 true → mineBlock 사용. 응답에 attempts, elapsedMs 포함.
 *
 * 5단계: 블록을 만든 뒤 broadcastBlock(block) 호출을 여기에 추가하세요.
 */
chainRouter.post("/blocks", (req, res) => {
  const { data, mine } = req.body ?? {};
  if (typeof data !== "string" || data.length === 0) {
    res.status(400).json({ error: "data(string) is required" });
    return;
  }

  const prev = getLatestBlock();

  if (mine === false) {
    const block = createNextBlock(prev, data);
    chain.push(block);
    res.status(201).json({ block });
    return;
  }

  const result = mineBlock(prev, data);
  chain.push(result.block);
  res.status(201).json(result);
});

/** GET /validate — 체인 검증 */
chainRouter.get("/validate", (_req, res) => {
  res.json(validateChain(chain));
});

/** POST /tamper/:index  body: { data: string } */
chainRouter.post("/tamper/:index", (req, res) => {
  const index = Number(req.params.index);
  const { data } = req.body ?? {};
  if (!Number.isInteger(index) || typeof data !== "string") {
    res.status(400).json({ error: "index(int) and data(string) are required" });
    return;
  }
  const block = tamperBlock(index, data);
  if (!block) {
    res.status(404).json({ error: `block ${index} not found` });
    return;
  }
  res.json({ tampered: block, validation: validateChain(chain) });
});

/** GET /difficulty, PUT /difficulty body: { difficulty: number } */
chainRouter.get("/difficulty", (_req, res) => {
  res.json({ difficulty: powConfig.difficulty });
});
chainRouter.put("/difficulty", (req, res) => {
  const d = Number(req.body?.difficulty);
  if (!Number.isInteger(d) || d < 0 || d > 6) {
    res.status(400).json({ error: "difficulty must be an integer 0..6" });
    return;
  }
  powConfig.difficulty = d;
  res.json({ difficulty: d });
});
