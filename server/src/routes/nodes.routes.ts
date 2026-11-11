import { Router } from "express";
import { peers, registerPeers, receiveBlock, resolveConflicts } from "../network/nodes.js";
import { asyncHandler } from "./chain.routes.js";

/**
 * 노드(P2P) API 라우터 — 5단계
 */
export function createNodesRouter(selfUrl: string) {
  const router = Router();

  /** GET /nodes — 내가 아는 피어 목록 */
  router.get("/nodes", (_req, res) => {
    res.json({ self: selfUrl, peers: [...peers] });
  });

  /** POST /nodes/register  body: { nodes: string[] } */
  router.post("/nodes/register", (req, res) => {
    const nodes = req.body?.nodes;
    if (!Array.isArray(nodes) || !nodes.every((n) => typeof n === "string")) {
      res.status(400).json({ error: "nodes(string[]) is required" });
      return;
    }
    res.json({ self: selfUrl, peers: registerPeers(nodes, selfUrl) });
  });

  /**
   * POST /blocks/receive  body: Block — 다른 노드가 전파한 블록 수신
   *  need-sync 면 그 자리에서 resolve 를 실행해 따라잡습니다.
   */
  router.post(
    "/blocks/receive",
    asyncHandler(async (req, res) => {
      const status = receiveBlock(req.body);
      if (status === "need-sync") {
        const resolved = await resolveConflicts();
        res.json({ status, resolved });
        return;
      }
      res.status(status === "rejected" ? 400 : 200).json({ status });
    }),
  );

  /** GET /nodes/resolve — 합의 실행 */
  router.get(
    "/nodes/resolve",
    asyncHandler(async (_req, res) => {
      res.json(await resolveConflicts());
    }),
  );

  return router;
}
