import express from "express";
import cors from "cors";
import { chainRouter } from "./routes/chain.routes.js";
import { createNodesRouter } from "./routes/nodes.routes.js";

export function createApp(selfUrl: string) {
  const app = express();
  app.use(cors()); // 프론트엔드(5173)에서 호출할 수 있게
  app.use(express.json()); // req.body JSON 파싱

  app.get("/", (_req, res) => {
    res.json({ node: selfUrl, ok: true });
  });

  app.use(chainRouter);
  app.use(createNodesRouter(selfUrl));

  // 에러 핸들러: 구현 안 된 TODO에서 throw 되면 500으로 메시지가 보입니다.
  app.use(
    (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: message });
    },
  );

  return app;
}
