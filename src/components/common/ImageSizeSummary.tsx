export function ImageSizeSummary({
  sourceBytes,
  outputBytes,
}: {
  sourceBytes?: number;
  outputBytes: number;
}) {
  const bytes = (size: number) => `${size.toLocaleString('ja-JP')} B`;
  const difference = sourceBytes && ((outputBytes - sourceBytes) / sourceBytes) * 100;
  return (
    <div className="image-size-summary" aria-live="polite" aria-atomic="true">
      <p>
        元ファイル：
        {sourceBytes === undefined ? 'サンプル（比較用の元ファイルなし）' : bytes(sourceBytes)}
      </p>
      <p>
        保存するファイル：<strong>{bytes(outputBytes)}</strong>
        {difference !== undefined && sourceBytes !== undefined && sourceBytes > 0 && (
          <span>
            （{Math.abs(difference).toFixed(1)}%{difference <= 0 ? '減少' : '増加'}）
          </span>
        )}
      </p>
      <p>プレビューは圧縮後の画像です。この容量・画質で保存します。</p>
    </div>
  );
}
