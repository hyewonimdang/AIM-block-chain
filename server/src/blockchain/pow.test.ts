import { describe, it, expect } from "vitest";
import { createGenesisBlock } from "./block.js";
import { hashMeetsDifficulty, mineBlock } from "./pow.js";
import { validateChain } from "./chain.js";

describe("3단계: 작업증명", () => {
  it("hashMeetsDifficulty", () => {
    expect(hashMeetsDifficulty("000abc", 3)).toBe(true);
    expect(hashMeetsDifficulty("00abc", 3)).toBe(false);
    expect(hashMeetsDifficulty("abc", 0)).toBe(true);
  });

  it("채굴한 블록은 difficulty 조건을 만족하고 attempts = nonce + 1", () => {
    const g = createGenesisBlock();
    const r = mineBlock(g, "mined", 2);
    expect(r.block.hash.startsWith("00")).toBe(true);
    expect(r.attempts).toBe(r.block.nonce + 1);
    expect(r.block.prevHash).toBe(g.hash);
  });

  it("채굴한 체인은 같은 difficulty 로 검증을 통과한다", () => {
    const g = createGenesisBlock();
    const b1 = mineBlock(g, "a", 2).block;
    const b2 = mineBlock(b1, "b", 2).block;
    expect(validateChain([g, b1, b2], 2).valid).toBe(true);
    // 더 높은 난이도를 요구하면 실패할 수 있다 (우연히 통과할 확률 1/16^(차이))
  });

  it("onProgress 는 1000 번마다 호출된다", () => {
    const calls: number[] = [];
    const r = mineBlock(createGenesisBlock(), "p", 3, (nonce) => calls.push(nonce));
    expect(calls.every((n) => n % 1000 === 0)).toBe(true);
    expect(calls.length).toBe(Math.floor(r.block.nonce / 1000));
  });
});
