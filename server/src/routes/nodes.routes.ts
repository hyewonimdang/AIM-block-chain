import { Router } from "express";
import { peers, registerPeers, receiveBlock, resolveConflicts } from "../network/nodes.js";

/**
 * 노드(P2P) API 라우터 (보일러플레이트) — 5단계
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

  /** POST /blocks/receive  body: Block — 다른 노드가 전파한 블록 수신 */
  router.post("/blocks/receive", (req, res) => {
    const status = receiveBlock(req.body);
    res.status(status === "rejected" ? 400 : 200).json({ status });
  });

  /** GET /nodes/resolve — 합의 실행 */
  router.get("/nodes/resolve", async (_req, res) => {
    res.json(await resolveConflicts());
  });

  return router;
}
