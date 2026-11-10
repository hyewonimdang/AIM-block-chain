/**
 * 블록체인 API 호출 래퍼 (보일러플레이트)
 * 노드 주소를 매개변수로 받아서, 노드 3개를 나란히 보여줄 때 같은 함수를 재사용합니다.
 */
import type { Block, ValidationResult, MineResult } from "../types";

export const NODES = ["http://localhost:3001", "http://localhost:3002", "http://localhost:3003"];

async function request<T>(base: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(base + path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
  return body as T;
}

export const api = {
  getChain: (base: string) => request<{ length: number; chain: Block[] }>(base, "/chain"),

  addBlock: (base: string, data: string, mine = true) =>
    request<MineResult | { block: Block }>(base, "/blocks", {
      method: "POST",
      body: JSON.stringify({ data, mine }),
    }),

  validate: (base: string) => request<ValidationResult>(base, "/validate"),

  tamper: (base: string, index: number, data: string) =>
    request<{ tampered: Block; validation: ValidationResult }>(base, `/tamper/${index}`, {
      method: "POST",
      body: JSON.stringify({ data }),
    }),

  getDifficulty: (base: string) => request<{ difficulty: number }>(base, "/difficulty"),
  setDifficulty: (base: string, difficulty: number) =>
    request<{ difficulty: number }>(base, "/difficulty", {
      method: "PUT",
      body: JSON.stringify({ difficulty }),
    }),

  getPeers: (base: string) => request<{ self: string; peers: string[] }>(base, "/nodes"),
  registerPeers: (base: string, nodes: string[]) =>
    request<{ self: string; peers: string[] }>(base, "/nodes/register", {
      method: "POST",
      body: JSON.stringify({ nodes }),
    }),
  resolve: (base: string) =>
    request<{ replaced: boolean; newLength: number; source: string | null }>(
      base,
      "/nodes/resolve",
    ),
};
