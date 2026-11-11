import { describe, it, expect, beforeEach } from "vitest";
import { chain, initChain, validateChain, isBlockHashValid } from "./chain.js";
import { createGenesisBlock, createNextBlock } from "./block.js";
import { tamperBlock } from "./tamper.js";

/**
 * 2단계(검증) + 4단계(위변조) 테스트
 * difficulty 0 으로 호출해 작업증명과 분리해서 검증 로직만 봅니다.
 */
describe("2단계: validateChain", () => {
  beforeEach(() => {
    initChain();
    chain.push(createNextBlock(chain[0], "b1"));
    chain.push(createNextBlock(chain[1], "b2"));
    chain.push(createNextBlock(chain[2], "b3"));
  });

  it("정상 체인은 valid", () => {
    expect(validateChain(chain, 0)).toEqual({ valid: true, brokenAt: null, reason: null });
  });

  it("빈 체인은 invalid", () => {
    expect(validateChain([], 0).valid).toBe(false);
  });

  it("제네시스가 다르면 brokenAt 0", () => {
    const fake = { ...createGenesisBlock(), hash: "deadbeef" };
    const r = validateChain([fake, ...chain.slice(1)], 0);
    expect(r).toMatchObject({ valid: false, brokenAt: 0, reason: "genesis mismatch" });
  });

  it("prevHash 가 끊기면 그 블록에서 prevHash mismatch", () => {
    const copy = chain.map((b) => ({ ...b }));
    copy[2].prevHash = "x".repeat(64);
    expect(validateChain(copy, 0)).toMatchObject({ brokenAt: 2, reason: "prevHash mismatch" });
  });

  it("index 가 어긋나면 index mismatch", () => {
    const copy = chain.map((b) => ({ ...b }));
    copy[1].index = 5;
    expect(validateChain(copy, 0)).toMatchObject({ brokenAt: 1, reason: "index mismatch" });
  });

  it("difficulty 를 요구하면 nonce 0 블록은 difficulty not met", () => {
    // createNextBlock 은 작업증명을 안 하므로 앞자리 0 이 우연히 아니면 실패해야 함
    const r = validateChain(chain, 6);
    expect(r.valid).toBe(false);
    expect(r.reason).toBe("difficulty not met");
  });
});

describe("4단계: tamperBlock", () => {
  beforeEach(() => {
    initChain();
    chain.push(createNextBlock(chain[0], "b1"));
    chain.push(createNextBlock(chain[1], "b2"));
    chain.push(createNextBlock(chain[2], "b3"));
  });

  it("data 만 바꾸면 그 블록에서 hash mismatch", () => {
    tamperBlock(2, "hacked");
    expect(isBlockHashValid(chain[2])).toBe(false);
    expect(validateChain(chain, 0)).toMatchObject({ brokenAt: 2, reason: "hash mismatch" });
  });

  it("hash 까지 다시 계산하면 다음 블록에서 prevHash mismatch", () => {
    tamperBlock(2, "hacked", { recompute: true });
    expect(isBlockHashValid(chain[2])).toBe(true); // 자기 자신은 멀쩡해 보임
    expect(validateChain(chain, 0)).toMatchObject({ brokenAt: 3, reason: "prevHash mismatch" });
  });

  it("마지막 블록을 hash 까지 다시 계산하면 검증을 통과한다 (뒤에 블록이 없으므로)", () => {
    tamperBlock(3, "hacked", { recompute: true });
    expect(validateChain(chain, 0).valid).toBe(true);
    // → 이것이 "최근 블록은 아직 불안정하다 / 확정(confirmation)이 쌓여야 안전하다" 는 개념의 출발점입니다.
  });

  it("범위 밖 index 는 null", () => {
    expect(tamperBlock(99, "x")).toBeNull();
  });
});
