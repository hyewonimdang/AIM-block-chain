import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { chain, initChain } from "../blockchain/chain.js";
import { createGenesisBlock } from "../blockchain/block.js";
import { mineBlock, powConfig } from "../blockchain/pow.js";
import { peers, registerPeers, receiveBlock, resolveConflicts, broadcastBlock } from "./nodes.js";

/**
 * 5단계 테스트. 실제 HTTP 대신 fetch 를 가짜(mock)로 바꿔서 "다른 노드"를 흉내냅니다.
 *
 * [학습 포인트] 네트워크 코드를 테스트할 때는 네트워크를 떼어내고 "우리 로직"만 봅니다.
 *  vi.stubGlobal("fetch", ...) 로 전역 fetch 를 바꿔치기합니다.
 */
const D = 1; // 테스트용 낮은 난이도

function mineChain(length: number) {
  const out = [createGenesisBlock()];
  for (let i = 1; i < length; i++) out.push(mineBlock(out[i - 1], `b${i}`, D).block);
  return out;
}

function fakeFetch(map: Record<string, unknown>) {
  return vi.fn(async (url: string) => {
    const base = url.replace(/\/(chain|blocks\/receive)$/, "");
    if (!(base in map)) throw new Error("ECONNREFUSED");
    return { ok: true, json: async () => map[base] } as Response;
  });
}

beforeEach(() => {
  initChain();
  peers.clear();
  powConfig.difficulty = D;
});
afterEach(() => vi.unstubAllGlobals());

describe("registerPeers", () => {
  it("자기 자신과 중복을 제외한다", () => {
    const r = registerPeers(
      ["http://localhost:3001", "http://localhost:3002/", "http://localhost:3002", ""],
      "http://localhost:3001",
    );
    expect(r).toEqual(["http://localhost:3002"]);
  });
});

describe("receiveBlock", () => {
  it("바로 다음 블록이면 appended", () => {
    const next = mineBlock(chain[0], "n", D).block;
    expect(receiveBlock(next)).toBe("appended");
    expect(chain.length).toBe(2);
  });

  it("2칸 이상 앞선 블록이면 need-sync", () => {
    const c = mineChain(4);
    expect(receiveBlock(c[3])).toBe("need-sync");
    expect(chain.length).toBe(1);
  });

  it("prevHash 가 다르면 rejected (포크 상황)", () => {
    const other = mineChain(2)[1];
    const forged = { ...other, prevHash: "f".repeat(64) };
    expect(receiveBlock(forged)).toBe("rejected");
  });

  it("Block 모양이 아니면 rejected", () => {
    expect(receiveBlock({ hello: "world" })).toBe("rejected");
  });
});

describe("broadcastBlock", () => {
  it("실패한 피어가 있어도 나머지는 성공으로 보고한다", async () => {
    registerPeers(["http://a", "http://b"], "http://me");
    vi.stubGlobal("fetch", fakeFetch({ "http://a": { status: "appended" } }));
    const r = await broadcastBlock(chain[0]);
    expect(r.ok).toEqual(["http://a"]);
    expect(r.failed).toEqual(["http://b"]);
  });
});

describe("resolveConflicts", () => {
  it("가장 긴 유효 체인으로 교체한다", async () => {
    registerPeers(["http://a", "http://b", "http://c"], "http://me");
    const longer = mineChain(4);
    const shorter = mineChain(2);
    vi.stubGlobal(
      "fetch",
      fakeFetch({ "http://a": { chain: shorter }, "http://b": { chain: longer } }), // c 는 꺼져 있음
    );
    const r = await resolveConflicts();
    expect(r.replaced).toBe(true);
    expect(r.source).toBe("http://b");
    expect(chain.length).toBe(4);
    expect(r.peers.find((p) => p.url === "http://c")?.length).toBeNull();
  });

  it("더 길어도 유효하지 않은 체인은 무시한다", async () => {
    registerPeers(["http://evil"], "http://me");
    const bad = mineChain(5);
    bad[2].data = "tampered";
    vi.stubGlobal("fetch", fakeFetch({ "http://evil": { chain: bad } }));
    const r = await resolveConflicts();
    expect(r.replaced).toBe(false);
    expect(chain.length).toBe(1);
  });

  it("같은 길이면 교체하지 않는다", async () => {
    registerPeers(["http://a"], "http://me");
    vi.stubGlobal("fetch", fakeFetch({ "http://a": { chain: mineChain(1) } }));
    expect((await resolveConflicts()).replaced).toBe(false);
  });

  it("내 체인이 위변조되어 있으면 같은 길이의 유효한 체인으로 교체한다", async () => {
    const good = mineChain(3);
    chain.length = 0;
    chain.push(...good.map((b) => ({ ...b })));
    chain[1].data = "tampered"; // 나는 깨짐, 길이는 3 으로 같음
    registerPeers(["http://a"], "http://me");
    vi.stubGlobal("fetch", fakeFetch({ "http://a": { chain: good } }));
    const r = await resolveConflicts();
    expect(r.replaced).toBe(true);
    expect(chain[1].data).toBe("b1");
  });
});
