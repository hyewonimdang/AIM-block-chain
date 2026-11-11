import type { Block } from "../types";

/** hash 를 앞 10자리만 보여줍니다. 전체는 title(툴팁)로. */
export function short(hash: string, n = 10): string {
  return hash.slice(0, n) + "…";
}

interface Props {
  block: Block;
  /** 검증이 깨진 블록이거나 그 이후 블록 */
  broken?: boolean;
  /** 깨진 바로 그 블록 (이유 표시) */
  reason?: string | null;
  compact?: boolean;
  onTamper?: (index: number) => void;
}

/**
 * 블록 카드.
 * [시각화 설계]
 *  - prevHash 와 hash 를 위아래로 두고, 옆 카드의 hash 와 같은 값이면 화살표로 연결됩니다.
 *  - broken 이면 테두리가 빨갛게 바뀝니다. 깨진 블록 "이후 전부"를 broken 으로 칠하는 이유는
 *    chain.ts 의 validateChain 주석을 참고하세요. (깨진 블록 위에 쌓인 블록은 신뢰할 수 없음)
 */
export function BlockCard({ block, broken, reason, compact, onTamper }: Props) {
  return (
    <div className={`block-card${broken ? " broken" : ""}${compact ? " compact" : ""}`}>
      <div className="block-head">
        <strong>#{block.index}</strong>
        {reason && <span className="badge">{reason}</span>}
        {block.index === 0 && <span className="badge muted">genesis</span>}
      </div>
      {!compact && (
        <div className="block-data" title={block.data}>
          {block.data}
        </div>
      )}
      <div className="hash-row">
        <span className="label">prev</span>
        <span className="hash" title={block.prevHash}>
          {short(block.prevHash)}
        </span>
      </div>
      <div className="hash-row">
        <span className="label">hash</span>
        <span className="hash" title={block.hash}>
          {short(block.hash)}
        </span>
      </div>
      {!compact && (
        <div className="block-foot">
          <span className="label">nonce {block.nonce}</span>
          {onTamper && block.index > 0 && (
            <button className="small danger" onClick={() => onTamper(block.index)}>
              위변조
            </button>
          )}
        </div>
      )}
    </div>
  );
}
