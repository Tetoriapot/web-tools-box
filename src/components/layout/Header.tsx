import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { tools } from '../../data/tools';
import { useTheme } from '../../hooks/useTheme';
import { Icon } from '../common/Icon';
import { Dialog } from '../common/Dialog';
import { HelpContent } from './HelpContent';
import { UpdatesContent } from './UpdatesContent';

export function Header() {
  const { theme, toggle } = useTheme();
  const [panel, setPanel] = useState<'updates' | 'help' | null>(null);
  const { pathname } = useLocation();
  const tool = tools.find((entry) => pathname === `/tools/${entry.slug}`);
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="brand" aria-label="Web Tools Box ホーム">
          <span className="brand-icon">
            <Icon name="toolbox" size={25} />
          </span>
          <span>
            Web Tools Box<span className="brand-caption">ブラウザで使えるWeb制作ツール集</span>
          </span>
        </Link>
        <nav className="header-nav" aria-label="メインナビゲーション">
          <NavLink to="/" end className="nav-link">
            ツール一覧
          </NavLink>
          <NavLink to="/about" className="nav-link">
            このサイトについて
          </NavLink>
        </nav>
        <div className="header-actions" role="group" aria-label="表示とサポート">
          <button
            className="header-action"
            type="button"
            aria-haspopup="dialog"
            onClick={() => setPanel('updates')}
          >
            <Icon name="history" size={18} />
            更新情報
          </button>
          <button
            className="header-action theme-toggle"
            type="button"
            onClick={toggle}
            aria-label={`${theme === 'light' ? 'ダーク' : 'ライト'}モードに切り替える`}
          >
            <Icon name={theme === 'light' ? 'moon' : 'sun'} />
            <span>
              {theme === 'light' ? 'ダーク' : 'ライト'}
              <span className="theme-mode-label">モード</span>
            </span>
          </button>
          <button
            className="header-action"
            type="button"
            aria-haspopup="dialog"
            aria-label="Help（ヘルプ）"
            onClick={() => setPanel('help')}
          >
            <Icon name="help" size={18} />
            Help
          </button>
        </div>
      </div>
      {panel && (
        <Dialog
          title={panel === 'updates' ? '更新情報' : 'Help（ヘルプ）'}
          onClose={() => setPanel(null)}
        >
          {panel === 'updates' ? <UpdatesContent /> : <HelpContent tool={tool} />}
        </Dialog>
      )}
    </header>
  );
}
