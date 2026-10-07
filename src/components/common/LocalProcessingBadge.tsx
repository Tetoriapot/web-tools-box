import { Icon } from './Icon';

export function LocalProcessingBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? 'local-badge compact' : 'local-badge'}>
      <Icon name="shield" size={compact ? 14 : 16} />
      {compact ? 'Local' : 'ブラウザ内で処理'}
    </span>
  );
}
