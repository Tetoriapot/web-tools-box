import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="empty-state">
      <span className="eyebrow">404 / NOT FOUND</span>
      <h1>ページが見つかりません</h1>
      <p>URLを確認するか、ツール一覧からお探しください。</p>
      <Link to="/" className="button primary">
        ツール一覧へ
      </Link>
    </section>
  );
}
