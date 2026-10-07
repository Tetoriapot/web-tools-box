import { validateText } from '../../lib/files';

export const caseFormats = [
  { id: 'camel', label: 'camelCase' },
  { id: 'pascal', label: 'PascalCase' },
  { id: 'snake', label: 'snake_case' },
  { id: 'kebab', label: 'kebab-case' },
  { id: 'constant', label: 'CONSTANT_CASE' },
  { id: 'title', label: 'Title Case' },
] as const;
export type CaseFormat = (typeof caseFormats)[number]['id'];

export function splitWords(input: string): string[] {
  return (
    input
      .normalize('NFC')
      .replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, '$1 $2')
      .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')
      .match(/[\p{L}\p{N}][\p{L}\p{N}\p{M}]*/gu) ?? []
  );
}

function title(word: string) {
  const chars = [...word];
  return (chars[0]?.toUpperCase() ?? '') + chars.slice(1).join('');
}

export function convertCase(input: string, format: CaseFormat): string {
  validateText(input);
  let hasWords = false;
  const result = input
    .split(/\r?\n/)
    .map((line) => {
      const words = splitWords(line).map((word) => word.toLowerCase());
      if (words.length) hasWords = true;
      switch (format) {
        case 'camel':
          return words.map((word, index) => (index === 0 ? word : title(word))).join('');
        case 'pascal':
          return words.map(title).join('');
        case 'snake':
          return words.join('_');
        case 'kebab':
          return words.join('-');
        case 'constant':
          return words.join('_').toUpperCase();
        case 'title':
          return words.map(title).join(' ');
      }
    })
    .join('\n');
  if (!hasWords) throw new Error('変換できる文字や数字を入力してください。');
  return result;
}

export const textSample = 'hello world\nbackground-color\nXMLHttpRequest\nWeb Tools Box';
