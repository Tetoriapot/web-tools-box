import { Link } from 'react-router-dom';
import { tools } from '../data/tools';
import { LocalProcessingBadge } from '../components/common/LocalProcessingBadge';
import { OfflineStatus } from '../components/common/OfflineStatus';

export default function AboutPage() {
  return (
    <article className="about-page">
      <Link className="back-link" to="/">
        ← ツール一覧に戻る
      </Link>
      <span className="eyebrow">ABOUT THIS TOOLBOX</span>
      <h1>ツール集について</h1>
      <p className="lead">
        Web Tools
        Boxは、個人開発者・Web制作者向けのツール集です。画像変換、JSON整形、CSS作成などをツールごとに1画面で操作できます。
      </p>
      <LocalProcessingBadge />
      <h2>入力内容について</h2>
      <p>
        変換・生成処理はブラウザ内で完結します。入力したテキスト、JSON、画像、生成結果を外部サーバーへ送信しません。外部API、解析タグ、外部フォントも使用していません。
      </p>
      <p>
        入力内容はページを離れると破棄され、ブラウザのストレージにも保存されません。コピーした内容や保存したファイルは、お使いの端末で管理してください。
      </p>
      <h2>ブラウザに保存するもの</h2>
      <p>
        ライト・ダークモードの選択をlocalStorageに保存します。オフライン利用のために、アプリ本体のプログラム・画面・アイコンもキャッシュします。入力内容や生成結果はキャッシュしません。ブラウザのサイトデータを削除すると、設定とキャッシュは消えます。
      </p>
      <h2>オフラインで使う</h2>
      <OfflineStatus />
      <p>
        初回はインターネット接続が必要です。準備が完了すると、まだ開いていないものも含め全20ツールをオフラインで利用できます。ブラウザのメニューからホーム画面などに追加することもできます。インストールは任意です。
      </p>
      <p>
        更新が見つかっても、作業中の画面は自動で再読み込みしません。必要な結果をコピー・保存し、このサイトのタブとアプリをすべて閉じてから開いてください。端末の空き容量不足やサイトデータの削除でキャッシュが消えた場合は、再びオンラインでの読み込みが必要です。
      </p>
      <h2>現在使えるツール</h2>
      <p>次のツールがご利用いただけます。</p>
      <ul>
        {tools
          .filter((tool) => tool.status !== 'planned')
          .map((tool) => (
            <li key={tool.id}>
              <Link to={`/tools/${tool.slug}`}>{tool.japaneseName}</Link>
            </li>
          ))}
      </ul>
      <h2>対応環境</h2>
      <p>
        最新のChrome・Edge・Firefox・Safariを想定しています。コピーやUUID生成には、HTTPSまたはlocalhostの安全な環境が必要な場合があります。ページの初回読み込みにはインターネット接続が必要です。
      </p>
    </article>
  );
}
