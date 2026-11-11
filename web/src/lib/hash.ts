/**
 * 브라우저용 SHA-256. 서버의 server/src/blockchain/block.ts 와 **같은 입력 형식**을 써야
 * 같은 해시가 나옵니다. (JSON.stringify([index, timestamp, data, prevHash, nonce]))
 *
 * [학습 포인트]
 *  - Node 는 node:crypto 의 createHash(동기), 브라우저는 Web Crypto 의 crypto.subtle.digest(비동기).
 *  - 비동기라서 채굴 루프 안에서 await 가 걸리고, 그 틈에 React 가 화면을 다시 그릴 수 있습니다.
 *    → 서버에서는 불가능한 "nonce 가 올라가는 모습"을 보여줄 수 있는 이유입니다.
 */
export async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function calculateHash(
  index: number,
  timestamp: number,
  data: string,
  prevHash: string,
  nonce: number,
): Promise<string> {
  return sha256Hex(JSON.stringify([index, timestamp, data, prevHash, nonce]));
}

export function hashMeetsDifficulty(hash: string, difficulty: number): boolean {
  return hash.startsWith("0".repeat(difficulty));
}
