import { describe, expect, it } from 'vitest';
import { MARKDOWN_SAMPLE, renderMarkdown } from '../../src/tools/markdown-preview/logic';

describe('safe Markdown rendering', () => {
  it('renders GFM headings, tables, tasks, code and emphasis', () => {
    const html = renderMarkdown(MARKDOWN_SAMPLE);
    expect(html).toContain('<h1>小さな制作ノート</h1>');
    expect(html).toContain('<table>');
    expect(html).toContain('☑');
    expect(html).toContain('<pre><code>');
    expect(html).toContain('<strong>');
  });
  it('removes executable HTML, styles, network sources and clobbering attributes', () => {
    const payload =
      '<script>alert(1)</script><svg onload="alert(2)"><a href="javascript:alert(3)">x</a></svg><iframe src="https://example.invalid/leak"></iframe><img src="https://example.invalid/leak" onerror="alert(4)"><style>body{background:url(https://example.invalid)}</style><form><input autofocus></form><p id="root" name="x" style="color:red" onclick="alert(5)" data-x="a">text</p>';
    const html = renderMarkdown(payload);
    const container = document.createElement('div');
    container.innerHTML = html;
    expect(container.querySelector('script,svg,iframe,img,style,form,input')).toBeNull();
    expect(container.querySelector('[id],[name],[style],[onclick],[data-x]')).toBeNull();
    expect(html).not.toContain('https://example.invalid');
    expect(html).toContain('text');
  });
  it('shows image alt text without creating a fetchable image', () => {
    const html = renderMarkdown('![写真](https://example.invalid/private?text=secret)');
    expect(html).toContain('[画像: 写真]');
    expect(html).not.toContain('src');
    expect(html).not.toContain('secret');
  });
  it('allows explicit safe links but strips dangerous and relative navigation', () => {
    const html = renderMarkdown(
      '[safe](https://example.com) [bad](javascript:alert%281%29) [local](/tools/uuid-generator) <a href="data:text/html,boom" ping="https://example.invalid">bad</a>',
    );
    const container = document.createElement('div');
    container.innerHTML = html;
    expect(container.querySelectorAll('a[href]')).toHaveLength(1);
    expect(container.querySelector('a')).toHaveAttribute('rel', 'noopener noreferrer');
    expect(container.querySelector('a')).toHaveAttribute('target', '_blank');
    expect(html).not.toContain('ping=');
  });
  it('escapes code and handles empty/oversized text', () => {
    expect(renderMarkdown('```html\n<script>alert(1)</script>\n```')).toContain('&lt;script&gt;');
    expect(renderMarkdown('  ')).toBe('');
    expect(() => renderMarkdown('a'.repeat(100_001))).toThrow('100,000');
  });
});
