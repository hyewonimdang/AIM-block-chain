/**
 * 6단계(프론트엔드): 블록 카드 나열 + prevHash → hash 화살표 + 위변조 시 빨간색 표시
 *
 * 핵심 시각화 로직은 직접 작성합니다. 아래는 데이터 로딩 뼈대만 있습니다.
 *
 * TODO:
 *  - api.getChain(NODES[0]) 로 체인 불러오기 (useEffect)
 *  - 블록을 BlockCard 로 나열하고, 카드 사이에 화살표 표시
 *  - api.validate() 결과의 brokenAt 이후 블록은 "broken" 클래스 부여 → 빨간색
 *    (생각해 볼 것: brokenAt 번 블록만 빨간색? 그 이후 전부? 서버 validateChain 의 동작과 맞추세요)
 *  - 각 카드에 "위변조" 버튼 → api.tamper(index, newData) → 체인·검증 다시 불러오기
 *  - "블록 추가" 입력 폼 → api.addBlock
 */
export function ChainView() {
  return (
    <section>
      <h2>체인 / 위변조</h2>
      <p className="todo">TODO: 블록 카드 시각화를 구현하세요. (components/ChainView.tsx)</p>
    </section>
  );
}
