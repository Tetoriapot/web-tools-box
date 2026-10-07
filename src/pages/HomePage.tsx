import { useSearchParams } from 'react-router-dom';
import { categories, filterTools, tools } from '../data/tools';
import { ToolGrid } from '../components/tools/ToolGrid';
import { SearchBox } from '../components/tools/SearchBox';
import { CategoryTabs } from '../components/tools/CategoryTabs';
import { Icon } from '../components/common/Icon';

export default function HomePage() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const candidate = params.get('category') ?? 'all';
  const category = categories.some((entry) => entry.id === candidate) ? candidate : 'all';
  const filtered = filterTools(query, category);
  const ready = filtered.filter((tool) => tool.status !== 'planned');
  const planned = filtered.filter((tool) => tool.status === 'planned');
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value && value !== 'all') next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };
  return (
    <div className="home-page">
      <h1 className="directory-title">ツール一覧</h1>
      <section className="tool-directory" aria-label="ツールを探す">
        <SearchBox value={query} onChange={(value) => update('q', value)} />
        <CategoryTabs value={category} onChange={(value) => update('category', value)} />
        <p className="result-summary" aria-live="polite">
          {query || category !== 'all'
            ? `${filtered.length} 件のツールが見つかりました`
            : `${tools.filter((tool) => tool.status !== 'planned').length} 個のツールが、すぐに使えます。`}
        </p>
        {ready.length > 0 && (
          <section aria-labelledby="ready-heading">
            <div className="section-heading">
              <h2 id="ready-heading">
                すぐに使えるツール <span>{ready.length.toString().padStart(2, '0')}</span>
              </h2>
              <span className="section-note">
                <span className="status-dot" />
                インストール不要・ブラウザで完結
              </span>
            </div>
            <ToolGrid tools={ready} />
          </section>
        )}
        {planned.length > 0 && (
          <section className="planned-section" aria-labelledby="planned-heading">
            <div className="section-heading">
              <h2 id="planned-heading">
                開発予定のツール <span>{planned.length.toString().padStart(2, '0')}</span>
              </h2>
            </div>
            <ToolGrid tools={planned} />
          </section>
        )}
        {filtered.length === 0 && (
          <div className="empty-state">
            <Icon name="search" size={32} />
            <h2>ツールが見つかりませんでした</h2>
            <p>別のキーワードやカテゴリでお試しください。</p>
            <button type="button" className="button" onClick={() => setParams({})}>
              絞り込みをリセット
            </button>
          </div>
        )}
      </section>
      <aside className="local-banner">
        <span className="local-banner-icon">
          <Icon name="shield" size={27} />
        </span>
        <div>
          <h2>データの保存先</h2>
          <p>
            入力したテキストやファイルを、外部サーバーへ送信しません。
            <br className="desktop-break" />
            アカウント登録は不要です。
          </p>
        </div>
        <span className="banner-label">PRIVATE BY DESIGN</span>
      </aside>
    </div>
  );
}
