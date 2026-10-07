# TASKS FOR CODEX

## DONE: GitHub Pagesへの公開（2026-10-07）

- [x] 公開用パスに対応し、各ツールのURL直アクセスと再読み込みを維持
- [x] manifest・service workerの範囲とキャッシュを公開先のパスごとに分離
- [x] GitHub Actionsのビルド・検証・公開設定
- [x] TypeScript・lint・単体テスト・production build・既存機能の回帰確認
- [x] GitHub Pages相当の静的配信でURL直アクセス・画像保存・オフライン・両テーマを確認
- [x] README・更新情報・文面を更新し、yomiyasuで確認
- [x] GitHubへ反映し、公開URLで主要操作を確認

ローカル検証はTypeScript・lint・整形・production buildが成功。単体236件、E2E 160件が成功しています。

公開先は https://tetoriapot.github.io/web-tools-box/ 。全20ツールの直接アクセス、PC・スマートフォンの両テーマ、コピー・保存、Help・更新情報、オフライン画像保存・取り消しを確認しました。CIはオフライン準備待ちの1件が初回タイムアウト後の再試行で成功し、検証・公開ジョブともに成功しています。

## Phase 0: 初期化

- [x] Vite + React + TypeScript
- [x] React Router導入
- [x] CSS Variables定義
- [x] ESLint/Prettier
- [x] Vitest
- [x] Playwright

## Phase 1: 共通UI

- [x] AppShell
- [x] Header
- [x] Theme toggle
- [x] Home grid
- [x] Category tabs
- [x] Search
- [x] ToolLayout
- [x] Toast
- [x] ErrorBoundary
- [x] LocalProcessingBadge

## Phase 2: 低依存ツール

まず以下を実装して設計を固める。

- [x] UUID Generator
- [x] URL Encode / Decode
- [x] Text Case Converter
- [x] Gradient Maker
- [x] Box Shadow Maker

### 完了条件

- [x] routing / URL直アクセス / 404 / 準備中画面
- [x] copy / 全5ツールの実Clipboard API・失敗時案内
- [x] save / 全5ツールのダウンロード内容確認
- [x] reset / sample
- [x] 360 / 768 / 1024 / 1440px
- [x] light / dark / OS初期設定 / 選択保持
- [x] TypeScript / lint / build / format
- [x] 空入力・不正入力・大きな入力・ブラウザAPI非対応
- [x] キーボード・フォームラベル・コントラスト自動検査
- [x] ツール間の状態分離・入力の非永続化・外部送信なし
- [x] Vitest 57件 / Playwright 38件

2026-10-02: 初回依頼のPhase 0〜2を完了。
Phase 2にはファイル入力がないため、不適切なファイルの検証は対応ツールの追加時に行う。

## Phase 3: CSS/SVG系

- [x] Border Radius Maker
- [x] Clamp Calculator
- [x] SVG Background Maker
- [x] SVG Shape Maker

### 完了確認

- [x] 8値の連動・個別編集・ランダムな角丸
- [x] clamp計算の境界値・不正入力・ブラウザ実計算との一致
- [x] 8種類のSVG背景・SVG / CSS / Data URI・透明背景
- [x] 5種類のシェイプ・seed再現性・高さ・複雑さ・色・左右上下反転
- [x] 新4ツールのコピー・保存・サンプル・リセット・状態分離
- [x] 4画面幅 × 両テーマ、全9ツール＋トップの80画面確認
- [x] キーボード操作、フォームラベル、axeのWCAG A / AA検査
- [x] TypeScript / lint / build / format
- [x] Vitest 99件 / Playwright 58件（既存5ツールの回帰確認を含む）
- [x] README更新。新しい実行時・開発用依存の追加なし

Phase 3完了時点で9ツールが利用可能。残り11ツールは準備中。

## Phase 4: Data系

- [x] JSON Visualizer
- [x] JSON ↔ YAML
- [x] Base64 Converter
- [x] Markdown Preview

### 完了確認

- [x] JSON構文検証・整形・圧縮・ツリー折り畳み・キー検索・パスコピー
- [x] JSON/YAML双方向変換・構文検証・逆変換・重複キーと不適切な値の拒否
- [x] Base64のUTF-8テキスト / PNG・JPEG・WebP、Data URL、画像復元・保存
- [x] Markdown即時プレビュー・HTML安全化とコピー・元のMD保存
- [x] FileDropzoneと非同期読込を共通化。選択・ドロップ、形式・容量・UTF-8・画像データの検証
- [x] 空入力、不正入力、100,000文字、大量JSON、深い階層、循環参照、YAMLエイリアス制限
- [x] 不適切なファイル・破損画像・XSS入力・外部画像を扱ってもクラッシュ・外部通信なし
- [x] コピー・保存の内容一致、サンプル・リセット、読込中リセット、ツール間の状態分離
- [x] 画像確認のObject URLを成功・失敗時とも解放
- [x] 4画面幅 × 両テーマ、トップ＋13ツールの112画面確認。Base64画像モードも追加確認
- [x] キーボード操作、フォームラベル、axe WCAG A / AA検査、主要画面の目視
- [x] TypeScript / lint / build / format
- [x] Vitest 153件 / Playwright 82件（既存9ツールの回帰確認を含む）
- [x] README更新。yaml・marked・DOMPurifyの導入理由と入力制限を記載

2026-10-03: Phase 4完了時点で13ツールが利用可能。残り7ツールはPhase 5で実装。

## Phase 5: Image系

- [x] Screenshot Decorator
- [x] Code Shot
- [x] Favicon Maker
- [x] OGP Image Maker
- [x] QR Code Maker
- [x] Image Format Converter
- [x] Image Resizer

### 完了確認

- [x] Canvas描画・画像読込・プレビュー・保存・画像コピーを共通化
- [x] スクリーンショットの背景・余白・角丸・影・枠線・4比率、PNG / WebP保存
- [x] Code Shotの3テーマ・文字サイズ・行番号・余白・背景・ヘッダー、PNG保存
- [x] Faviconの文字・絵文字・画像、5サイズのPNG・ICO・manifest / HTML例・ZIP
- [x] OGPの6テンプレート・1200×630・タイトル・サブタイトル・背景画像・ロゴ
- [x] QRのサイズ・余白・配色、PNG / SVG出力、独立デコーダーで読み取り一致
- [x] PNG / JPEG / WebPの品質・寸法・透過、JPEG背景色、出力形式の実バイト一致
- [x] px / %、縦横比固定、Fit / Contain / Cover
- [x] 不正・空・破損・容量超過ファイル、サイズ上限、1px画像・極端に細い画像、空・過大テキスト
- [x] リセット中の古い読込結果の破棄、Canvas / 画像Clipboard API非対応、状態分離
- [x] 4画面幅 × 両テーマ、トップ＋20ツールの168画面を検査。横はみ出し・axe違反なし
- [x] スマホ・ダークモードの主要画面、OGP全6テンプレートの目視確認
- [x] TypeScript / lint / build / format
- [x] Vitest 180件 / Playwright 110件（既存13ツールの回帰確認を含む）
- [x] README更新。qrcode・JSZipの導入理由と入力制限を記載

2026-10-03: Phase 5を完了。全20ツールが利用可能。入力の外部送信・バックエンド追加なし。

## Phase 6: 品質

全20ツールの通常画面に加え、代替モード・エラー状態・キーボードによる一連の操作を確認。

- [x] 360px確認
- [x] 768px確認
- [x] keyboard navigation
- [x] aria labels
- [x] contrast
- [x] object URL revoke
- [x] file validation
- [x] error states

### 完了確認

- [x] スマートフォンのホームリンク・フッターリンク・JSONツリーの操作領域を44px以上へ修正
- [x] 数値の範囲・整数・空入力、ファイル・JSON等のエラーと入力欄を関連付け
- [x] 入力エラーの枠線が通常スタイルに上書きされる問題を修正し、実計算された色を検証
- [x] Image Resizerの倍率下限をUIと処理で0.01%に統一
- [x] PNG / JPEG / WebPの寸法をデコード前後で検査。切断・不正なヘッダーも安全に処理
- [x] Base64と画像ツールの読込・URL解放を共通化。読込失敗・処理失敗・画面離脱も検証
- [x] 代替モード・エラー・境界状態160画面を追加検査。主要なエラー画面を目視確認
- [x] 全20ツールでTab / Shift+Tab / Enterによるサンプル・主要操作・リセット・一覧への移動
- [x] TypeScript / lint / build / format
- [x] Vitest 196件 / Playwright 122件。通常168画面の表示検証を含む
- [x] README更新。追加依存なし

2026-10-03: Phase 6完了。検証ブラウザはChromium。Firefox / Safari実機・スクリーンリーダーの手動確認は未実施。

## Phase 7: PWA

- [x] manifest
- [x] service worker
- [x] offline shell

### 完了確認

- [x] 日本語manifest、192 / 512pxアイコン、maskable / Apple用アイコン。既存SVGから再生成可能
- [x] ビルド出力からキャッシュ一覧を生成。全20ツールと動的読込ライブラリをオフラインで使用可能
- [x] ビルド単位のキャッシュ・SHA-256 integrity検証。不完全な初回準備・更新は安全に失敗し、旧版を維持
- [x] 更新は全タブ・アプリ終了後に適用。作業中の強制再読み込みやインストール要求なし
- [x] 入力・生成結果・ファイル内容・画面URLのクエリを保存しない。任意リクエストの実行時キャッシュなし
- [x] Cache Storageから消えた静的ファイルの復旧、保存領域利用拒否・非対応・登録失敗の安全な処理
- [x] About画面の準備状態・更新待ち・非対応表示、4画面幅 × 両テーマの表示確認とPC / スマホのaxe検査
- [x] オフラインで全ツールの直接アクセス・コピー / 保存・ZIP・リセット・再読み込み・404
- [x] 別タブの入力保持、最後の旧タブを閉じた後の移行、旧キャッシュ削除・無関係なキャッシュ保持
- [x] TypeScript / lint / build / format
- [x] Vitest 216件 / Playwright 138件。最終フォールバック修正後にもPWA関連16件を再検証
- [x] READMEの利用方法・配信設定・プライバシー・検証結果を更新。追加依存なし

2026-10-03: Phase 7完了。Phase 0〜7の全項目を実装。公開先へのデプロイは未実施。
Chromiumで検証済み。Firefox / Safari実機、OSへの実インストールは未検証。

## 追加対応: 右上の共通操作（2026-10-05）

- [x] 更新情報・ライト／ダーク切り替え・Helpをヘッダー右上へ配置
- [x] 更新履歴と現在のバージョン・オフライン準備状況を表示
- [x] Helpに現在のツールの説明・基本操作・コピー／保存・ファイル・プライバシーの案内を表示
- [x] 入力を保持する共通ダイアログ、Esc・Tab・操作元へのフォーカス復帰
- [x] モバイルはラベルを残して右寄せ2段構成。閉じる操作はスクロール中も表示
- [x] 320 / 360 / 768 / 1024 / 1440px × 両テーマ、オフライン・dialog API非対応の検証
- [x] TypeScript / lint / build / format、Vitest 216件 / Playwright 146件、PC・スマホの主要表示を目視確認

v0.7.1時点では20人のペルソナに基づく改善案は提案のみ。その後の「優先順位どおりに実装」の依頼により、次の4項目を実装しました。

## 追加対応: 優先改善・紹介エリアの削除（2026-10-05 / v0.8.0）

- [x] 指定画像のトップ紹介エリアと装飾を削除し、検索・ツール一覧を上部へ配置
- [x] 優先1: 全20ツールのサンプル／リセットを1回取り消し。入力・設定・結果・エラーを復元
- [x] 編集・実行・コピー／保存・ルート移動で履歴を破棄。Help・テーマ・作業エリア移動は保持
- [x] 復元で非同期読込をキャンセル。画像もメモリのみで扱い、操作元にキーボードフォーカスを返す
- [x] 優先2: 画像形式変換・リサイズの圧縮済みプレビュー、正確な出力バイト数・増減率。表示したBlobを保存
- [x] 更新中／エラー時は古い出力の保存を無効化し、使用したObject URLを解放
- [x] 優先3: 幅800px以下で入力・結果へ移動。状態保持、フォーカス移動、固定ナビとの重なり対策
- [x] 優先4: Registryの日本語名をカード主表示にし、用途を表す検索語を追加
- [x] Help・更新情報・READMEの動作説明を更新
- [x] 最終確認: TypeScript / lint / build / format、Vitest 228件 / Playwright 158件。全20ツールの取り消し・コピー／保存・入力境界・不正ファイル・PWAを検証
- [x] 360 / 768 / 1024 / 1440px × ライト／ダークでトップ・全ツールの表示とaxe検査を実施。PC・スマートフォンの主要画面を目視確認

上記4項目以外のペルソナ改善案は未実装。バックエンド・外部API・依存ライブラリの追加なし。

## Codexへの実装ルール

1. 1 Phaseごとに完了させる。
2. 未実装をUI上で完成済みに見せない。
3. ダミーボタン禁止。
4. console error 0を維持。
5. 各Phase終了時にREADMEを更新。
6. ライブラリ追加時は理由をREADMEへ記載。
7. server uploadは禁止。
8. UIと処理ロジックを分離。
9. 画像はObject URLを適切に破棄。
10. 最低限のテストを同時に追加。
