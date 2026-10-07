import { currentVersion, releases } from '../../data/releases';
import { OfflineStatus } from '../common/OfflineStatus';

export function UpdatesContent() {
  return (
    <>
      <p className="dialog-intro">
        現在表示しているバージョン：<strong>v{currentVersion}</strong>
      </p>
      <h3>アプリの更新について</h3>
      <OfflineStatus />
      <p>
        新しいバージョンの準備ができたら、必要な結果をコピー・保存し、このサイトのタブとアプリをすべて閉じてから開いてください。作業中の画面は自動で再読み込みしません。
      </p>
      <h3>これまでの主な更新</h3>
      <ol className="release-list">
        {releases.map((release) => (
          <li key={release.version}>
            <div className="release-meta">
              <span>v{release.version}</span>
              <time dateTime={release.date}>{release.date.replaceAll('-', '/')}</time>
            </div>
            <h4>{release.title}</h4>
            <ul>
              {release.changes.map((change) => (
                <li key={change}>{change}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </>
  );
}
