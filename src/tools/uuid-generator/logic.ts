export type UuidFormat = 'lines' | 'csv';

export function parseCount(value: string): number {
  if (!/^\d+$/.test(value.trim())) throw new Error('生成数は1〜100の整数で入力してください。');
  const count = Number(value);
  if (!Number.isInteger(count) || count < 1 || count > 100)
    throw new Error('生成数は1〜100の整数で入力してください。');
  return count;
}

export function generateUuids(count: number): string[] {
  if (!Number.isInteger(count) || count < 1 || count > 100)
    throw new Error('生成数は1〜100の整数で入力してください。');
  const source = globalThis.crypto;
  if (
    !source ||
    (typeof source.randomUUID !== 'function' && typeof source.getRandomValues !== 'function')
  )
    throw new Error(
      'このブラウザでは安全な乱数を生成できません。HTTPSまたはlocalhostで開いてください。',
    );
  return Array.from({ length: count }, () => {
    if (typeof source.randomUUID === 'function') return source.randomUUID();
    const bytes = source.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6]! & 0x0f) | 0x40;
    bytes[8] = (bytes[8]! & 0x3f) | 0x80;
    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  });
}

export function formatUuids(ids: string[], format: UuidFormat): string {
  return ids.join(format === 'csv' ? ',' : '\n');
}

export const sampleUuids = [
  '550e8400-e29b-41d4-a716-446655440000',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  '6ba7b810-9dad-41d1-80b4-00c04fd430c8',
];
