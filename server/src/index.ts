import { createApp } from "./app.js";
import { initChain } from "./blockchain/chain.js";

const PORT = Number(process.env.PORT ?? 3001);
const SELF_URL = process.env.SELF_URL ?? `http://localhost:${PORT}`;

try {
  initChain();
} catch (err) {
  // 체인 초기화에 실패해도 서버는 띄워서 에러를 확인할 수 있게 합니다.
  console.warn(`[warn] chain init failed: ${(err as Error).message}`);
}

createApp(SELF_URL).listen(PORT, () => {
  console.log(`[node] listening on ${SELF_URL}`);
});
