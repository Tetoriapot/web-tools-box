import { validateText } from './files';

export type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export const MAX_DATA_NODES = 10_000;
export const MAX_DATA_DEPTH = 40;

export function assertJsonValue(value: unknown): asserts value is JsonValue {
  let count = 0;
  function visit(node: unknown, depth: number, ancestors: Set<object>) {
    if (++count > MAX_DATA_NODES) throw new Error('データは10,000項目以内にしてください。');
    if (depth > MAX_DATA_DEPTH) throw new Error('データの階層は40段以内にしてください。');
    if (node === null || typeof node === 'string' || typeof node === 'boolean') return;
    if (typeof node === 'number') {
      if (!Number.isFinite(node) || (Number.isInteger(node) && !Number.isSafeInteger(node)))
        throw new Error('数値が扱える範囲を超えています。大きな整数は文字列にしてください。');
      return;
    }
    if (typeof node !== 'object') throw new Error('JSONに変換できない値が含まれています。');
    if (ancestors.has(node)) throw new Error('循環参照はJSONに変換できません。');
    if (
      !Array.isArray(node) &&
      Object.getPrototypeOf(node) !== Object.prototype &&
      Object.getPrototypeOf(node) !== null
    )
      throw new Error('JSONに変換できないオブジェクトが含まれています。');
    ancestors.add(node);
    for (const child of Object.values(node)) visit(child, depth + 1, ancestors);
    ancestors.delete(node);
  }
  visit(value, 0, new Set());
}

export function parseJson(text: string): JsonValue {
  validateText(text);
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const position = /position (\d+)/.exec(message)?.[1];
    const line = position
      ? text.slice(0, Number(position)).split('\n').length
      : /line (\d+)/.exec(message)?.[1];
    throw new Error(
      `JSON${line ? `の${line}行目付近` : ''}に構文エラーがあります。引用符・カンマ・括弧を確認してください。`,
      { cause: error },
    );
  }
  assertJsonValue(value);
  return value;
}
