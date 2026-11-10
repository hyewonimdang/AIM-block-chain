/**
 * 6단계(프론트엔드): 노드 3개의 체인 상태를 나란히 표시 + 동기화 과정 시각화
 *
 * TODO:
 *  - NODES 3개 각각에 api.getChain 호출 → 3열로 블록 index/hash 앞 8자리 표시
 *  - 주기적 polling(예: 1초)으로 갱신
 *  - "노드 1에 블록 추가" 버튼 → 전파 후 다른 노드에 나타나는지 확인
 *  - "resolve" 버튼 → api.resolve(node) → 체인이 교체되는 순간을 강조 표시
 *  - 노드가 꺼져 있으면(fetch 실패) 회색으로 표시
 */
export function NodesView() {
  return (
    <section>
      <h2>노드 동기화</h2>
      <p className="todo">TODO: 노드 3개 시각화를 구현하세요. (components/NodesView.tsx)</p>
    </section>
  );
}
