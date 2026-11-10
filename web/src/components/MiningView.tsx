/**
 * 6단계(프론트엔드): 채굴 중 nonce 증가 과정 시각화
 *
 * 설계 선택지 (직접 고르세요):
 *  A. 서버가 채굴을 끝낸 뒤 attempts / elapsedMs 만 받아서 요약 표시 (쉬움)
 *  B. 브라우저에서 같은 해시 로직(Web Crypto API: crypto.subtle.digest)으로 직접 채굴하며
 *     nonce 가 올라가는 것을 실시간으로 보여주기 (서버 로직을 프론트에 옮겨보는 경험)
 *  C. 서버에서 SSE(Server-Sent Events)로 진행 상황 스트리밍 (백엔드 추가 작업 필요, 5단계와 별개로 흥미 측정 가능)
 *
 * TODO:
 *  - 난이도 선택 UI (api.getDifficulty / setDifficulty)
 *  - 채굴 버튼 → 결과(attempts, elapsedMs, hash)를 표시
 *  - 난이도별 소요 시간을 기록해 간단한 표/그래프로 비교
 */
export function MiningView() {
  return (
    <section>
      <h2>채굴 (작업증명)</h2>
      <p className="todo">TODO: 채굴 시각화를 구현하세요. (components/MiningView.tsx)</p>
    </section>
  );
}
