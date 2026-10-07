export function normalizeHex(value: string): string | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  const hex = match?.[1];
  if (!hex) return null;
  return `#${(hex.length === 3 ? [...hex].map((char) => char + char).join('') : hex).toLowerCase()}`;
}

export function hexToRgb(value: string): [number, number, number] {
  const hex = normalizeHex(value);
  if (!hex) throw new Error('色は3桁または6桁のHEXで入力してください。');
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}
