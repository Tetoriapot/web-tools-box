import { useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { tools } from '../../data/tools';
import { Header } from './Header';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { Icon } from '../common/Icon';

export function AppShell() {
  const { pathname } = useLocation();
  const previousPath = useRef(pathname);
  useEffect(() => {
    const tool = tools.find((entry) => pathname === `/tools/${entry.slug}`);
    document.title = tool
      ? `${tool.name} | Web Tools Box`
      : pathname === '/about'
        ? 'このサイトについて | Web Tools Box'
        : 'Web Tools Box | ブラウザで使えるWeb制作ツール集';
    if (previousPath.current !== pathname) {
      document.getElementById('main-content')?.focus({ preventScroll: true });
      window.scrollTo(0, 0);
      previousPath.current = pathname;
    }
  }, [pathname]);
  return (
    <>
      <a href="#main-content" className="skip-link">
        メインコンテンツへ移動
      </a>
      <Header />
      <main id="main-content" className="main-content" tabIndex={-1}>
        <ErrorBoundary key={pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
      <footer className="site-footer">
        <div className="footer-inner">
          <div>
            <Link className="footer-brand" to="/">
              <Icon name="toolbox" />
              Web Tools Box
            </Link>
          </div>
          <div className="footer-meta">
            <span>
              <Icon name="shield" size={16} />
              入力データを外部に送信しません
            </span>
            <Link to="/about">このサイトについて・プライバシー</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
