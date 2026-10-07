export function assertRange(value: number, min: number, max: number, label: string): void {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(
      `${label}は${min.toLocaleString()}〜${max.toLocaleString()}で指定してください。`,
    );
  }
}

export function parseNumber(value: string, min: number, max: number, label: string): number {
  if (!value.trim()) throw new Error(`${label}を入力してください。`);
  const number = Number(value);
  assertRange(number, min, max, label);
  return number;
}

export function formatNumber(value: number, digits = 6): string {
  return String(Number(value.toFixed(digits)));
}
