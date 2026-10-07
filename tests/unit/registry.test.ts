import { describe, expect, it } from 'vitest';
import { filterTools, tools } from '../../src/data/tools';

describe('tool registry', () => {
  it('defines twenty tools with unique routes', () => {
    expect(tools).toHaveLength(20);
    expect(new Set(tools.map((tool) => tool.slug)).size).toBe(20);
    expect(tools.every((tool) => tool.localOnly)).toBe(true);
    expect(tools.filter((tool) => tool.status === 'ready')).toHaveLength(20);
    expect(tools.every((tool) => tool.status === 'planned' || tool.load)).toBe(true);
  });
  it('searches Japanese, case-insensitive English and full-width characters', () => {
    expect(filterTools('ＵＵＩＤ')[0]?.id).toBe('uuid-generator');
    expect(filterTools('シャドウ')[0]?.id).toBe('box-shadow-maker');
    expect(filterTools('URL encode')[0]?.id).toBe('url-encoder');
  });
  it('combines category and search filters', () => {
    expect(filterTools('画像', 'text').map((tool) => tool.id)).toEqual(['base64-converter']);
    expect(filterTools('見つからない文字列')).toHaveLength(0);
  });
  it.each([
    ['画像を軽くする', 'image-format-converter'],
    ['画像を縮小', 'image-resizer'],
    ['サイトアイコン', 'favicon-maker'],
    ['コードを画像にする', 'code-shot'],
    ['角を丸くする', 'border-radius-maker'],
    ['ＪＳＯＮをＹＡＭＬにする', 'json-yaml-converter'],
    ['マークダウン', 'markdown-preview'],
  ])('finds %s from a task description', (query, id) => {
    expect(filterTools(query).map((tool) => tool.id)).toContain(id);
  });
});
