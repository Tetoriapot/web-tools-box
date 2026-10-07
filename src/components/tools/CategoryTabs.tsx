import { categories } from '../../data/tools';

export function CategoryTabs({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="category-tabs" role="group" aria-label="カテゴリで絞り込む">
      {[{ id: 'all', label: 'すべて' }, ...categories].map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onChange(category.id)}
          aria-pressed={value === category.id}
          className={value === category.id ? 'active' : ''}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
