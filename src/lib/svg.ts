import { formatNumber } from './numbers';

// Only call with application-generated markup and validated numeric/color values.
// This is not an SVG sanitizer or an entry point for uploaded SVG files.
export function svgDocument(
  width: number,
  height: number,
  markup: string,
  stretch = false,
): string {
  const w = formatNumber(width);
  const h = formatNumber(height);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"${stretch ? ' preserveAspectRatio="none"' : ''}>\n${markup}\n</svg>`;
}

export function svgDataUri(svg: string): string {
  if (!svg || svg.length > 100_000) throw new Error('SVGのサイズが出力できる範囲を超えています。');
  return `data:image/svg+xml,${encodeURIComponent(svg).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)}`;
}
