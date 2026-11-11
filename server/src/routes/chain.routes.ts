import { Router, type Request, type Response, type NextFunction } from "express";
import { chain, validateChain, getLatestBlock } from "../blockchain/chain.js";
import { tamperBlock } from "../blockchain/tamper.js";
import { createNextBlock } from "../blockchain/block.js";
import { mineBlock, powConfig } from "../blockchain/pow.js";
import { broadcastBlock } from "../network/nodes.js";

/**
 * 블록체인 API 라우터
 *
 * [Express 기초]
 *  - router.get(경로, (req, res) => {...})  → GET 요청 처리
 *  - req.params.index  → URL 의 :index 부분 (문자열이므로 Number() 로 변환)
 *  - req.body          → JSON 본문 (app.ts 의 express.json() 미들웨어가 파싱)
 *  - res.status(400).json({...}) → 상태코드 + JSON 응답
 *
 * [async 핸들러 주의]
 *  Express 4 는 async 함수에서 던져진 에러를 잡지 못합니다. (5 부터 지원)
 *  그래서 asyncHandler 로 감싸 next(err) 로 넘겨 app.ts 의 에러 핸들러가 처리하게 합니다.
 */
type AsyncHandler = (req: Request, res: Response) => Promise<void>;
export const asyncHandler =
  (fn: AsyncHandler) => (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

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
 *  - mine=false : 작업증명 없이 추가 (1단계 학습용). 난이도>0 이면 /validate 에서 걸립니다.
 *  - 기본       : mineBlock 으로 채굴. 응답에 attempts, elapsedMs 포함.
 *  - 5단계      : 추가한 블록을 피어에게 전파하고 결과(broadcast)를 함께 돌려줍니다.
 */
chainRouter.post(
  "/blocks",
  asyncHandler(async (req, res) => {
    const { data, mine } = req.body ?? {};
    if (typeof data !== "string" || data.length === 0) {
      res.status(400).json({ error: "data(string) is required" });
      return;
    }

    const prev = getLatestBlock();

    if (mine === false) {
      const block = createNextBlock(prev, data);
      chain.push(block);
      const broadcast = await broadcastBlock(block);
      res.status(201).json({ block, broadcast });
      return;
    }

    const result = mineBlock(prev, data);
    chain.push(result.block);
    const broadcast = await broadcastBlock(result.block);
    res.status(201).json({ ...result, broadcast });
  }),
);

/** GET /validate?difficulty=N — 체인 검증. difficulty 생략 시 현재 설정값 */
chainRouter.get("/validate", (req, res) => {
  const raw = req.query.difficulty;
  const difficulty = raw === undefined ? powConfig.difficulty : Number(raw);
  res.json(validateChain(chain, Number.isInteger(difficulty) ? difficulty : powConfig.difficulty));
});

/** POST /tamper/:index  body: { data: string, recompute?: boolean } */
chainRouter.post("/tamper/:index", (req, res) => {
  const index = Number(req.params.index);
  const { data, recompute } = req.body ?? {};
  if (!Number.isInteger(index) || typeof data !== "string") {
    res.status(400).json({ error: "index(int) and data(string) are required" });
    return;
  }
  const block = tamperBlock(index, data, { recompute: recompute === true });
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
