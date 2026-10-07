import { Component, type ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <section className="empty-state" role="alert">
          <h1>画面を表示できませんでした</h1>
          <p>再読み込みしてお試しください。入力データは外部に送信されていません。</p>
          <button className="button primary" onClick={() => window.location.reload()}>
            再読み込み
          </button>
          <a className="button" href="/">
            ツール一覧へ
          </a>
        </section>
      );
    return this.props.children;
  }
}
