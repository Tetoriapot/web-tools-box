import { validateText } from '../../lib/files';

export type UrlMode = 'encode' | 'decode' | 'query';
export type QueryEntry = { key: string; value: string };

export function encodeText(input: string): string {
  validateText(input);
  try {
    return encodeURIComponent(input);
  } catch {
    throw new Error('エンコードできない文字が含まれています。入力内容を確認してください。');
  }
}

export function decodeText(input: string): string {
  validateText(input);
  try {
    return decodeURIComponent(input);
  } catch {
    throw new Error(
      'URLをデコードできません。「%」に続く16進数やUTF-8の文字列を確認してください。',
    );
  }
}

export function parseQuery(input: string): QueryEntry[] {
  validateText(input);
  let query = input.trim();
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(query)) {
    try {
      query = new URL(query).search.slice(1);
    } catch {
      throw new Error('URLの形式を確認してください。');
    }
  } else if (query.startsWith('?')) query = query.slice(1);
  query = query.split('#')[0] ?? '';
  if (!query) throw new Error('クエリがありません。「name=value」の形式で入力してください。');
  const pairs = query.split('&').filter(Boolean);
  if (pairs.length > 2000) throw new Error('クエリの項目数は2,000件以内にしてください。');
  if (!pairs.length) throw new Error('読み取れるクエリがありません。');
  return pairs.map((pair) => {
    const separator = pair.indexOf('=');
    const key = separator < 0 ? pair : pair.slice(0, separator);
    const value = separator < 0 ? '' : pair.slice(separator + 1);
    try {
      return {
        key: decodeURIComponent(key.replace(/\+/g, ' ')),
        value: decodeURIComponent(value.replace(/\+/g, ' ')),
      };
    } catch {
      throw new Error('クエリに不正なパーセントエンコードが含まれています。');
    }
  });
}

export const urlSamples: Record<UrlMode, string> = {
  encode: 'こんにちは Web Tools Box! /?name=田中&color=green',
  decode: '%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF%20Web%20Tools%20Box!',
  query: 'https://example.com/search?q=%E6%97%A5%E6%9C%AC%E8%AA%9E&tag=css&tag=design&page=1',
};
