export const sansFont = '"Yu Gothic", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif';
export const monoFont = 'Consolas, "Yu Gothic", monospace';

export function graphemes(text: string) {
  return typeof Intl.Segmenter === 'function'
    ? [...new Intl.Segmenter('ja', { granularity: 'grapheme' }).segment(text)].map(
        (part) => part.segment,
      )
    : Array.from(text);
}
export function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.replace(/\r\n?/g, '\n').split('\n')) {
    let line = '';
    for (const character of graphemes(paragraph)) {
      if (line && context.measureText(line + character).width > maxWidth) {
        lines.push(line);
        line = character;
      } else line += character;
    }
    lines.push(line);
  }
  return lines;
}
export function fittedText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
  startSize: number,
  minSize: number,
  weight = 700,
) {
  for (let size = startSize; size >= minSize; size -= 2) {
    context.font = `${weight} ${size}px ${sansFont}`;
    const lines = wrapText(context, text, maxWidth);
    if (lines.length <= maxLines) return { lines, size };
  }
  throw new Error('文字が収まりません。文章を短くするか、別のテンプレートを選んでください。');
}
