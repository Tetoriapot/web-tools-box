import DOMPurify from 'dompurify';
import { Marked } from 'marked';
import { MAX_TEXT_LENGTH } from '../../lib/files';

export const MARKDOWN_SAMPLE =
  '# 小さな制作ノート\n\n必要なときに、**すぐ使える**ツール集です。\n\n## 今日のチェック\n\n- [x] ブラウザだけで処理\n- [x] 日本語に対応\n- [ ] 次のアイデアを試す\n\n> 入力したデータは外部へ送信しません。\n\n| ツール | 用途 |\n| --- | --- |\n| JSON | データを確認 |\n| Markdown | 文章をプレビュー |\n\n```css\n.note {\n  border-radius: 12px;\n}\n```\n';

function escapeHtml(text: string) {
  return text.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!,
  );
}
const parser = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    image: ({ text }) => `<span>[画像: ${escapeHtml(text || '説明なし')}]</span>`,
    checkbox: ({ checked }) => `<span>${checked ? '☑' : '☐'} </span>`,
  },
});

// A strict allow-list excludes every automatic network source, executable and style.
// This sanitized fragment is used for both preview and HTML export.
export function renderMarkdown(text: string) {
  if (text.length > MAX_TEXT_LENGTH) throw new Error('入力は100,000文字以内にしてください。');
  if (!text.trim()) return '';
  if (!DOMPurify.isSupported) throw new Error('このブラウザでは安全なプレビューを利用できません。');
  const fragment = DOMPurify.sanitize(parser.parse(text, { async: false }), {
    ALLOWED_TAGS: [
      'p',
      'br',
      'hr',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'strong',
      'em',
      'del',
      's',
      'blockquote',
      'ul',
      'ol',
      'li',
      'pre',
      'code',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'a',
      'span',
      'div',
      'sup',
      'sub',
      'kbd',
    ],
    ALLOWED_ATTR: ['href', 'title', 'start'],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    ALLOWED_URI_REGEXP: /^(?:https?:\/\/|mailto:|#)/i,
    RETURN_DOM_FRAGMENT: true,
  });
  for (const link of fragment.querySelectorAll('a[href]')) {
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
  }
  const holder = document.createElement('div');
  holder.append(fragment);
  return holder.innerHTML;
}
