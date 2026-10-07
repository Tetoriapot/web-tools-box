export function errorMessage(
  error: unknown,
  fallback = '処理できませんでした。入力内容を確認してください。',
): string {
  return error instanceof Error ? error.message : fallback;
}
