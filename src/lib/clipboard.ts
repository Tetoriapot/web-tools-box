export async function copyText(text: string): Promise<void> {
  if (!text) throw new Error('コピーする結果がありません。');
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      /* Try the local fallback below. */
    }
  }
  const previousFocus =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const selection = window.getSelection();
  const previousRanges = selection
    ? Array.from({ length: selection.rangeCount }, (_, index) =>
        selection.getRangeAt(index).cloneRange(),
      )
    : [];
  const field = document.createElement('textarea');
  field.value = text;
  field.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
  field.setAttribute('aria-label', 'コピー用一時フィールド');
  document.body.append(field);
  try {
    field.focus();
    field.select();
    if (typeof document.execCommand !== 'function' || !document.execCommand('copy'))
      throw new Error('コピーを許可できませんでした。結果を選択して手動でコピーしてください。');
  } finally {
    field.remove();
    previousFocus?.focus({ preventScroll: true });
    if (selection && previousRanges.length) {
      selection.removeAllRanges();
      previousRanges.forEach((range) => selection.addRange(range));
    }
  }
}
