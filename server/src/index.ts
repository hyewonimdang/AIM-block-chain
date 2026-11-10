import { createApp } from "./app.js";
import { initChain } from "./blockchain/chain.js";

const PORT = Number(process.env.PORT ?? 3001);
const SELF_URL = process.env.SELF_URL ?? `http://localhost:${PORT}`;

try {
  initChain();
} catch (err) {
  // 1단계 구현 전에는 createGenesisBlock 이 throw 합니다. 서버는 띄우되 경고만 출력합니다.
  console.warn(`[warn] chain init failed: ${(err as Error).message}`);
}

createApp(SELF_URL).listen(PORT, () => {
  console.log(`[node] listening on ${SELF_URL}`);
});
