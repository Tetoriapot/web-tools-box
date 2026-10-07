import { Icon } from '../common/Icon';
import { tools } from '../../data/tools';

export function SearchBox({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="search-box">
      <Icon name="search" size={22} />
      <label htmlFor="tool-search" className="sr-only">
        ツールを検索
      </label>
      <input
        id="tool-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="ツール名や、やりたいことから探す…"
        autoComplete="off"
        maxLength={200}
      />
      {value && (
        <button
          type="button"
          className="icon-button"
          onClick={() => onChange('')}
          aria-label="検索をクリア"
        >
          <Icon name="close" size={18} />
        </button>
      )}
      <span className="search-hint">{tools.length} tools</span>
    </div>
  );
}
