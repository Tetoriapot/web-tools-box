import { useEffect, useSyncExternalStore } from 'react';
import { offlineSupport, type OfflineStatus as Status } from '../../lib/offline';

const messages: Record<Status, string> = {
  development: '開発モードではオフライン機能を使用しません。',
  unsupported: 'この環境ではオフライン機能を利用できません。オンラインでご利用ください。',
  preparing: 'オフライン利用の準備中です。このまま少しお待ちください。',
  ready: 'オフラインで利用できます。',
  'update-ready':
    'オフラインで利用できます。新しいバージョンの準備もできました。このサイトのタブとアプリをすべて閉じてから開くと更新されます。',
  unavailable:
    'オフライン利用の準備ができていません。オンラインでページを開き直してください。通常のツール操作はそのまま利用できます。',
};

export function OfflineStatus() {
  const status = useSyncExternalStore(offlineSupport.subscribe, offlineSupport.getSnapshot);
  useEffect(() => {
    void offlineSupport.refresh();
  }, []);
  return (
    <p className="offline-status" role="status" aria-live="polite" aria-atomic="true">
      {messages[status]}
    </p>
  );
}
