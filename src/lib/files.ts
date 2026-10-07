export const MAX_TEXT_LENGTH = 100_000;

export function validateText(text: string): void {
  if (!text.trim()) throw new Error('変換するテキストを入力してください。');
  if (text.length > MAX_TEXT_LENGTH) throw new Error('入力は100,000文字以内にしてください。');
}

export function downloadText(text: string, filename: string, type = 'text/plain'): void {
  if (!text) throw new Error('保存する結果がありません。');
  downloadBlob(new Blob([text], { type: `${type};charset=utf-8` }), filename);
}

export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof URL.createObjectURL !== 'function')
    throw new Error('このブラウザではファイルを保存できません。コピーをご利用ください。');
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.hidden = true;
  document.body.append(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    // Immediate revocation can cancel downloads in some browsers.
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
}
