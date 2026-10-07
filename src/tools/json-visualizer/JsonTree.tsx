import { useId, useMemo, useState } from 'react';
import { Button } from '../../components/common/Button';
import { useClipboard } from '../../hooks/useClipboard';
import { filterRows, type JsonRow } from './logic';
import styles from './styles.module.css';

export function JsonTree({ rows }: { rows: JsonRow[] }) {
  const id = useId();
  const { copy } = useClipboard();
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState(new Set<string>());
  const [limit, setLimit] = useState(200);
  const filtered = useMemo(() => filterRows(rows, search, collapsed), [rows, search, collapsed]);
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>ツリー</h2>
        <span>{rows.length} 項目</span>
      </div>
      <div className="field">
        <label htmlFor={id}>キーを検索</label>
        <input
          id={id}
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setLimit(200);
          }}
          placeholder="例: name"
        />
      </div>
      <div className={styles.actions}>
        <Button
          disabled={!!search.trim()}
          onClick={() => {
            setCollapsed(new Set());
            setLimit(200);
          }}
        >
          すべて展開
        </Button>
        <Button
          disabled={!!search.trim()}
          onClick={() =>
            setCollapsed(new Set(rows.filter((row) => row.branch).map((row) => row.path)))
          }
        >
          すべて折り畳む
        </Button>
      </div>
      {search.trim() && (
        <p role="status">{filtered.matches} 件のキーが一致。親の項目も表示しています。</p>
      )}
      <ul className={styles.tree} aria-label="JSONの構造">
        {filtered.rows.slice(0, limit).map((row) => (
          <li
            key={row.path}
            className={styles.row}
            style={{ paddingInlineStart: `${Math.min(row.depth, 5) * 10}px` }}
          >
            <div className={styles.value}>
              {row.branch ? (
                <button
                  type="button"
                  className={styles.branch}
                  aria-expanded={!!search.trim() || !collapsed.has(row.path)}
                  aria-label={`${row.path}を${collapsed.has(row.path) ? '展開' : '折り畳む'}`}
                  disabled={!!search.trim()}
                  onClick={() =>
                    setCollapsed((old) => {
                      const next = new Set(old);
                      if (next.has(row.path)) next.delete(row.path);
                      else next.add(row.path);
                      return next;
                    })
                  }
                >
                  <span aria-hidden="true">
                    {collapsed.has(row.path) && !search.trim() ? '▸' : '▾'}
                  </span>{' '}
                  {row.key}
                </button>
              ) : (
                <strong className={styles.key}>{row.key}</strong>
              )}
              <code className={styles.summary}>
                {row.summary.length > 200 ? `${row.summary.slice(0, 200)}…` : row.summary}
              </code>
            </div>
            <button
              type="button"
              className={styles.path}
              title={row.path}
              aria-label={`パスをコピー: ${row.path}`}
              onClick={() => void copy(row.path)}
            >
              パス
            </button>
          </li>
        ))}
      </ul>
      {filtered.rows.length > limit && (
        <Button onClick={() => setLimit((value) => value + 200)}>
          次の200項目を表示（残り{filtered.rows.length - limit}件）
        </Button>
      )}
      <p className="field-hint">「パス」で $["key"][0] 形式の参照先をコピーできます。</p>
    </section>
  );
}
