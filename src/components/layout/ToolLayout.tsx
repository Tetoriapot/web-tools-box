import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { categories, type ToolDefinition } from '../../data/tools';
import { LocalProcessingBadge } from '../common/LocalProcessingBadge';
import { Icon } from '../common/Icon';

export function ToolLayout({ tool, children }: { tool: ToolDefinition; children: ReactNode }) {
  return (
    <div className="tool-page">
      <Link to="/" className="back-link">
        <Icon name="back" size={17} />
        ツール一覧に戻る
      </Link>
      <header className="tool-heading">
        <div>
          <span className="eyebrow">
            {categories.find((category) => category.id === tool.category)?.english}
          </span>
          <h1>{tool.name}</h1>
          <p>{tool.description}</p>
        </div>
        <LocalProcessingBadge />
      </header>
      {children}
      <aside className="privacy-note">
        <Icon name="shield" size={18} />
        <p>処理はすべて、このブラウザの中で。入力内容は保存・送信されません。</p>
      </aside>
    </div>
  );
}
