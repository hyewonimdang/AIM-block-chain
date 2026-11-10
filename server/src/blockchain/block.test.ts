import { describe, it, expect } from "vitest";
import { calculateHash, createGenesisBlock, createNextBlock } from "./block.js";

/**
 * 1단계 테스트. 루트에서 `npm test -w server` 로 실행.
 * 구현 전에는 전부 실패합니다. 하나씩 통과시켜 보세요.
 */
describe("1단계: block", () => {
  it("같은 입력 → 같은 해시, 64자 hex", () => {
    const a = calculateHash(1, 1000, "hi", "abc", 0);
    const b = calculateHash(1, 1000, "hi", "abc", 0);
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("입력이 조금만 달라도 해시가 달라진다", () => {
    const a = calculateHash(1, 1000, "hi", "abc", 0);
    const b = calculateHash(1, 1000, "hi", "abc", 1);
    expect(a).not.toBe(b);
  });

  it("제네시스는 항상 동일하다 (고정 timestamp)", () => {
    const g1 = createGenesisBlock();
    const g2 = createGenesisBlock();
    expect(g1.index).toBe(0);
    expect(g1.hash).toBe(g2.hash);
  });

  it("다음 블록은 prevHash로 연결된다", () => {
    const g = createGenesisBlock();
    const next = createNextBlock(g, "block 1");
    expect(next.index).toBe(1);
    expect(next.prevHash).toBe(g.hash);
    expect(next.hash).toBe(
      calculateHash(next.index, next.timestamp, next.data, next.prevHash, next.nonce),
    );
  });
});
