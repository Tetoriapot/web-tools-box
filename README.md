# Web Tools Box

個人開発者・Web制作者向けの、ログイン不要・ブラウザ完結型ミニWebツール集。
制作中の小さな作業を「1目的1画面」で処理します。

## 実装状況

**Phase 0〜7を実装済み。** Registryで管理する全20ツールが利用できます。
PWAに対応し、初回の準備完了後は全ツールをオフラインで使用できます。インストールは任意です。

| ツール                 | URL                             | 実装内容                                                                 |
| ---------------------- | ------------------------------- | ------------------------------------------------------------------------ |
| UUID Generator         | `/tools/uuid-generator`         | 暗号学的に安全なUUID v4、1〜100件、改行・CSV                             |
| URL Encode / Decode    | `/tools/url-encoder`            | URIコンポーネント変換、クエリ解析、重複キーの保持                        |
| Text Case Converter    | `/tools/text-case-converter`    | 6種類のケース変換、複数行、Unicode文字保持                               |
| Gradient Maker         | `/tools/gradient-maker`         | 線形・円形、2〜8色、角度・位置、4プリセット、CSS出力                     |
| Box Shadow Maker       | `/tools/box-shadow-maker`       | X/Y・ぼかし・広がり・色・不透明度・inset、CSS出力                        |
| Border Radius Maker    | `/tools/border-radius-maker`    | 8値の角丸編集、全値連動・個別編集、Blob風ランダム、CSS出力               |
| Clamp Calculator       | `/tools/clamp-calculator`       | 最小・最大サイズと画面幅からclamp()計算、画面幅のシミュレーション        |
| SVG Background Maker   | `/tools/svg-background-maker`   | 8パターン、サイズ・太さ・色・透明背景、SVG / CSS / Data URI出力          |
| SVG Shape Maker        | `/tools/svg-shape-maker`        | 5種類、高さ・複雑さ・色・左右上下反転、seed再現、SVG出力                 |
| JSON Visualizer        | `/tools/json-visualizer`        | 構文検証、整形・圧縮、折り畳みツリー、キー検索、パスコピー、JSON読込     |
| JSON ↔ YAML Converter  | `/tools/json-yaml-converter`    | 双方向変換、構文検証、結果を入力にする逆変換、JSON / YAML読込            |
| Base64 Converter       | `/tools/base64-converter`       | UTF-8テキスト・PNG / JPEG / WebPの変換、Data URL、復元画像の保存         |
| Markdown Preview       | `/tools/markdown-preview`       | 即時プレビュー、GFM、HTML安全化・コピー、MD読込・保存                    |
| Screenshot Decorator   | `/tools/screenshot-decorator`   | 背景・グラデーション・余白・角丸・影・枠線・比率、PNG / WebP保存         |
| Code Shot              | `/tools/code-shot`              | 3テーマ、文字サイズ・行番号・余白・背景・ウィンドウヘッダー、PNG保存     |
| Favicon Maker          | `/tools/favicon-maker`          | 文字・絵文字・画像から5サイズのPNG、ICO、manifest・HTML例、ZIP保存       |
| OGP Image Maker        | `/tools/ogp-image-maker`        | 1200×630、6テンプレート、タイトル・サブタイトル・背景画像・ロゴ、PNG保存 |
| QR Code Maker          | `/tools/qr-code-maker`          | URL・テキスト、サイズ・余白・配色、PNG / SVG保存                         |
| Image Format Converter | `/tools/image-format-converter` | PNG / JPEG / WebP変換、品質・サイズ・縦横比、JPEG背景色                  |
| Image Resizer          | `/tools/image-resizer`          | px / %、縦横比固定、Fit / Contain / Cover、PNG / JPEG / WebP保存         |

各ツールにコピー、ファイル保存、サンプル、リセット、エラー表示、使い方を用意しています。
トップには検索とカテゴリフィルタがあり、テーマはOS設定を初期値に手動変更できます。

ヘッダー右上に「更新情報」「ライト／ダークモード」「Help」を配置しています。
更新情報では実装済みの変更履歴とオフライン準備状況を、Helpでは使用中のツールの説明と共通の使い方を確認できます。
どちらも画面を移動せず開けるため、入力は保持されます。Escまたは「閉じる」で閉じ、操作元へフォーカスが戻ります。
スマートフォンでは文字ラベルと操作領域を保つため、ヘッダーの2段目で右寄せしています。
履歴は `src/data/releases.ts`、現在のバージョンは `package.json` で管理します。

### 優先改善（v0.8.0）

トップの紹介エリアを削除し、検索とツール一覧を上部に配置しました。前回の改善案のうち、次の4項目を優先順に実装しています。

1. **誤操作の取り消し**: 全20ツールの「サンプル」「リセット」直後に「元に戻す」で直前の入力・設定・結果を1回復元できます。次の編集、実行・コピー・保存などの操作やルート移動で履歴を破棄します。Help・テーマ切り替え・入力と結果間の移動では保持します。履歴はブラウザのメモリ上だけに置き、処理途中だった読込は再開しません。
2. **圧縮結果の事前確認**: 画像形式変換・画像リサイズでPNG / JPEG / WebPを書き出してからプレビューを表示し、その同じBlobを保存します。元ファイルと出力のバイト数、増減率を表示します。サンプルは元ファイルがないため比較率を表示しません。画質・形式・寸法の変更中は古い画像を保存できません。画像コピーはプレビューの見た目をPNGにして渡します。
3. **スマホの入力・結果間移動**: 幅800px以下で「入力・設定へ」「結果へ」を表示。スクロールとフォーカスを移し、入力を保持します。
4. **日本語名と検索語**: カードは日本語名を主表示、英語名を併記。「画像を軽くする」「サイトアイコン」「コードを画像にする」などをRegistryの検索語に追加しました。

JSONツリー内のキー検索・展開状態は取り消しの復元対象外です。この4項目以外のペルソナ改善案は、今回の実装には含めていません。依存ライブラリの追加はありません。

## 起動

Node.js **22.13以上の22系、または24以上**とpnpm 11を使用します。
検証環境はNode.js 24.19.0 / pnpm 11.25.0です。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

表示されたlocalhostのURLを開いてください。標準は `http://127.0.0.1:5173` です。
この作業フォルダーは依存関係を導入済みのため、Node.jsから直接
`node node_modules/vite/bin/vite.js --host 127.0.0.1` でも起動できます。

```sh
# 本番用の静的ファイルをdist/に生成
pnpm build
# 本番ビルドをローカルで確認
pnpm preview
```

## 検証

```sh
# TypeScript → ESLint → Vitest → production build
pnpm check
# 整形確認
pnpm format:check
# Chromiumの導入（初回のみ）
pnpm exec playwright install chromium
# pnpm check または pnpm build の実行後、本番ビルドを検証
pnpm test:e2e
# HTMLレポート
pnpm exec playwright show-report
```

`pnpm typecheck`、`pnpm lint`、`pnpm test`も個別実行できます。
E2Eは4173番ポートを使用します。別のアプリが同じポートを使用している場合は終了させてから実行してください。
スクリーンショットは `test-results/`、HTMLレポートは `playwright-report/` に生成されます。

### 検証結果

- Phase 0: TypeScript・lint・build・初期画面のユニットテストとPC / スマホのE2E成功。
- Phase 1: TypeScript・lint・build、Registry / 検索のユニットテスト、検索・遷移・テーマ保持・キーボード操作のE2E成功。
- Phase 2: **TypeScript・lint・build成功、Vitest 57件、Playwright 38件成功。**
- Phase 3: **TypeScript・lint・build成功、Vitest 99件、Playwright 58件成功。** 既存ツールの回帰検証を含みます。
- Phase 4: **TypeScript・lint・build成功、Vitest 153件、Playwright 82件成功。** 既存ツールの回帰確認とファイル入力の検証を含みます。
- Phase 5: **TypeScript・lint・build成功、Vitest 180件、Playwright 110件成功。** 既存13ツールの回帰検証と画像系7ツールの検証を含みます。
- Phase 6: **TypeScript・lint・build・format成功、Vitest 196件、Playwright 122件成功。** フォームのエラー説明・画像読込・キーボード操作を含む全体の回帰検証です。
- Phase 7: **TypeScript・lint・build・format成功、Vitest 216件、Playwright 138件成功。** PWA関連16件を含みます。保存領域の後発的な利用拒否へのフォールバック追加後にも、PWA全16件を再検証しました。
- 2026-10-05 / v0.7.1: **TypeScript・lint・build・format成功、Vitest 216件、Playwright 146件成功。** 右上の共通操作、入力保持、ダイアログのキーボード操作・フォーカス復帰、320〜1440px・両テーマ、オフライン・dialog API非対応を検証しました。20人のペルソナからの改善案は提案のみで、実装対象には含めていません。
- 2026-10-05 / v0.8.0: **TypeScript・lint・build・format成功、Vitest 228件、Playwright 158件成功。** 全20ツールのリセット取り消しで入力・設定・出力の一致を検証。サンプル取り消し、ファイルとエラーの復元、編集後の履歴破棄、遅れて完了する処理の無視、画像の圧縮プレビューと保存結果の画素・容量一致、日本語の用途検索、360 / 768pxの入力・結果間移動とフォーカスを確認しました。トップ・全ツールの4画面幅 × 両テーマ、コピー・保存・入力境界・ファイル検証・PWAを含む回帰検証と、PC・スマートフォンの主要表示の目視確認も完了しています。
- 360 / 768 / 1024 / 1440px × ライト / ダーク × トップ＋20ツールの168画面を検証。横方向のはみ出しなし。axeのWCAG 2.0 / 2.1 A・AA自動検査で検出違反なし。主要画面のスクリーンショットを目視確認。Base64画像モードもPC・スマホの両テーマで追加確認しています。
- 全20ツールの主要操作、保存内容、サンプル・リセット、URL直アクセスを確認。テキスト・コードの実Clipboard APIでのコピーに加え、画像のコピーも確認しています。
- 空入力、壊れたパーセントエンコード、不正なHEX、UUIDの範囲外、100,000文字と上限超過、重複クエリを確認。
- Clipboard API / Web Crypto / localStorageが使えない場合、Object URLの遅延解放、ツール間の状態分離を確認。
- 角丸8値の連動・個別編集、clampの境界値とブラウザ実計算、8パターン・5シェイプのSVG描画、透明背景、反転、seed再現性、出力形式の切り替えを確認。
- SVGはXML形式・有限座標・危険な色文字列の拒否・Data URIの復元をテスト。読み込んだSVGをHTMLへ挿入する処理はありません。
- JSONの階層・数値・件数制限、パスの引用符エスケープ、YAMLの不正構文・重複キー・循環参照・エイリアス展開量を確認。
- ファイルの通常選択・ドロップ、空ファイル、形式不一致、UTF-8以外、バイナリ、破損画像、サイズ超過を確認。読込中のリセット・後続入力・画面離脱による古い結果の破棄と、画像検証時のObject URL解放もテスト。
- Base64の日本語・絵文字・BOM・改行、パディング、Data URL、PNG / JPEG / WebPの読込、復元画像のバイト一致を確認。
- Markdownのscript・イベント属性・SVG・iframe・外部画像・CSS・危険なリンクの除去、コードのエスケープ、安全化HTMLのコピーと元Markdownの保存を確認。
- PNG / JPEG / WebPの実バイト形式・寸法・透過、JPEGの背景色、割合・縦横比固定・3種類の収め方を確認。
- スクリーンショットの比率・角丸・枠線、1px画像・極端に細い画像、Code Shotの文字列保持・テーマ独立・空入力・行数制限を確認。
- favicon ZIP内9ファイル、5サイズのPNG、ICOに埋め込んだ16px / 32pxの画像、manifest・HTMLの内容を検証。
- OGPの6テンプレート・1200×630出力・背景画像・ロゴを検証。QRは独立したデコーダーで日本語・絵文字を含むURLの読み取り一致を確認。
- 画像入力5ツールで3形式の読込・不正ファイルからの復帰、10 MiB超過・巨大なPNGヘッダー・読込中リセット、Canvas / 画像Clipboard API非対応を確認。
- Phase 6では代替モード・エラー・境界状態を360 / 768px × 両テーマの160画面で追加確認。長いJSONキーも含め横はみ出し・axe違反なし。スマートフォンのホームリンクとJSONツリーの操作領域を44px以上に修正しました。
- 全20ツールでTab / Shift+Tab / Enterだけによる「メインへ移動 → サンプル → 生成・変換 → コピーまたは保存 → リセット → 一覧へ戻る」をPC・スマホ幅で検証。フォーカスの可視化と画面内へのスクロールも確認しています。
- 数値の空・範囲外・小数指定、ファイル・JSONのエラーを入力欄の説明に関連付けました。通常の枠線に上書きされていたエラー枠線も修正しています。OGPの背景画像とロゴは別々にエラーを関連付けます。
- PNG / JPEG / WebPの寸法をヘッダーから事前確認。巨大なヘッダーを実ブラウザで拒否し、切り詰めたヘッダー・バッファの部分ビュー・WebPのパディングをユニットテストで検証しました。
- 画像読込の成功・失敗・後続処理失敗に加え、Base64を含む画像入力6ツールの差し替え・保存・読込中の画面離脱後にObject URLが残らないことを確認しました。
- 初回の準備後、未訪問の全20ツールへオフラインで直接アクセスし、サンプル・コピー / 保存・リセットをPC・スマホ幅で検証しました。faviconのZIP用ライブラリもオフラインで読み込めます。
- manifest・PNGアイコンの実寸、キャッシュ内容とビルド出力の完全一致、入力・ファイル内容・クエリ文字列の非保存を確認。オフライン案内は4画面幅 × 両テーマで表示確認し、PC・スマホでaxe検査を行いました。
- 初回インストール失敗からの回復、キャッシュから消えたファイルの復旧、service worker非対応・登録拒否でも通常利用できることを確認しました。
- 不正な内容のファイルを含む更新は破棄して旧版を維持。正常な更新は2つのタブの入力を維持したまま待機し、最後の旧タブを閉じると新版へ移行します。無関係なキャッシュは残ります。
- E2E中のconsole error・未処理例外・外部へのHTTPリクエストは0件。

実ブラウザ検証はChromiumです。Firefox・Safari実機、OSのホーム画面への実インストール、およびスクリーンリーダーの手動検証は未実施です。
axeの合格はアクセシビリティ全体の完全保証ではありません。Lighthouseのスコア計測は未実施です。

## 設計

```text
src/
├─ app/                 アプリ、ルーティング、ツール単位lazy loading
├─ components/
│  ├─ common/           ボタン、入力、FileDropzone、通知、エラー、コピー・保存
│  ├─ layout/           ヘッダー、共通シェル、ツールヘッダー
│  └─ tools/            カード、検索、カテゴリ、入力・結果パネル
├─ data/tools.ts        全20ツールの情報とlazy importを一元管理
├─ hooks/               テーマ、通知、コピー・保存、非同期のローカル読込、Canvas描画
├─ lib/                 ファイル検証、画像・Canvas・文字配置、SVG、Clipboard、Blob保存
├─ pages/               トップ、サイト情報、404
├─ styles/              色トークン、共通UI、ツール作業画面
└─ tools/<slug>/        各ツールのUI・純粋ロジック・固有CSS
tests/
├─ unit/                変換・境界値・ブラウザAPI・Registry
└─ e2e/                 実操作・レスポンシブ・テーマ・アクセシビリティ
public/                 manifest・アイコン・初期テーマ設定
scripts/pwa.ts          ビルド済みファイルからバージョン付きservice workerを生成
scripts/service-worker.js  静的アセットだけを扱うservice workerの原稿
```

### ツールの追加

1. `src/tools/<slug>/` にUIと `logic.ts` を分離して作成します。
2. `src/data/tools.ts` の対象ツールに `load: () => import(...)`、日本語名と用途に合う検索語を登録します。
3. `useToolUndo` に入力・設定・結果のスナップショットと復元処理を渡し、`ToolWorkspace` の `undo` へ接続します。サンプルは `SampleButton`、リセットは `ResetButton` を使います。非同期読込は復元時にキャンセルし、状態オブジェクトを直接変更しないでください。
4. 動作確認後に `status` を `ready` または `beta` に変更します。
5. ユニットテストと主要操作のE2Eを追加し、`TASKS.md` を更新します。

カード・検索・ルーティング・画面タイトルはRegistryから生成されるため、各ページへの情報の重複登録は不要です。
ルート変更時にツールの入力状態を破棄し、入力値を他ツールや次回表示へ引き継ぎません。

### 入力制限

- テキスト / URL: 100,000 UTF-16コード単位まで。超過時は明示的なエラーを表示し、切り捨てません。
- クエリ解析: 2,000項目まで。同名キーと空の値を保持します。
- UUID: 1〜100件。`crypto.randomUUID` を優先し、`getRandomValues`へフォールバックします。安全な乱数を利用できない場合は生成しません。
- グラデーション: 2〜8色。色は3桁 / 6桁のHEXのみ。CSSへ任意文字列を埋め込みません。
- 角丸: 横4値・縦4値を0〜100%で指定。連動をオンにすると左上・横の値で全8値をそろえます。
- clamp: サイズ0〜1,000px、画面幅1〜10,000px。最小サイズ≦最大サイズ、最小画面幅＜最大画面幅（間隔1px以上）。小数も可。プレビュー文字は96pxを上限に縮小しますが、計算値と出力CSSは変更しません。
- SVG背景: 1タイルの基準サイズ12〜100px、線の太さ・点の直径1〜8px。六角形のタイル寸法は幾何に合わせて変化します。市松模様・三角形には線の太さ設定がありません。
- SVGシェイプ: 幅1,200px、高さ80〜600px、複雑さ2〜12、seedは0〜4,294,967,295の整数。擬似乱数は装飾専用で、UUID生成とは独立しています。
- SVGは検証した数値とHEX色から内部生成し、Data URIは100,000文字以下のSVGだけを変換します。SVGファイルは1タイルまたは1シェイプ、背景CSSは繰り返し表示用です。
- JSON / YAML: 入力100,000文字、展開後10,000項目、40階層まで。非有限数・安全な整数範囲を超える値を拒否します。JSONの重複キーは標準のJSON.parseに従い最後の値を保持します。
- JSONツリー: 初期表示200項目、追加ボタンで200項目ずつ表示。検索は一致するキーと親の項目を表示します。パスは `$["key"][0]` 形式です。
- YAML: 1.2 Coreスキーマ、単一ドキュメント。コメント・書式は保持せず、日時風の文字列は文字列のまま変換します。重複キー・文字列以外のキー・未対応タグ・循環参照を拒否し、エイリアスの展開量を制限します。
- テキストファイル: 拡張子を検証し、UTF-8のみ。400,000バイトと100,000文字をそれぞれ上限とし、NULを含むバイナリを拒否します。
- Base64: 標準アルファベットのみ。空白・改行と末尾パディング省略に対応し、不正な末尾ビットも検証します。テキストはUTF-8 / 100,000文字、画像はPNG / JPEG / WebP / 2 MiB / 1,600万画素まで。Data URLはBase64形式のみです。復元画像は元のバイト列を保持し、SVG・HTMLは画像として読み込みません。
- Markdown: 100,000文字まで。表・チェックリスト・コードブロックを含むGFMに対応。画像は自動読込せず代替テキストを表示します。HTMLを許可リストで安全化し、script・style・埋め込み・フォームを除去します。明示的なHTTP(S)・mailto・フラグメントのリンクだけを残し、クリック時に別タブで開きます。
- 画像系ツールの入力: PNG / JPEG / WebP、1ファイル10 MiB・1,600万画素・各辺8,192pxまで。拡張子・MIME・実データを検証します。判読可能なヘッダーの寸法はデコード前に検査し、ブラウザで読み込んだ後も再検査します。読込中のリセット・入力変更・離脱後は古い結果を表示しません。アニメーションは静止画となり、元のメタデータは引き継ぎません。
- Canvas出力: 1,600万画素・各辺8,192pxまで。PNGは透過対応。JPEGは選択した背景色で透明部分を塗ります。画像形式変換・リサイズのJPEG / WebP品質はプレビュー時に適用し、その結果を保存します。他の画像ツールは保存時に書き出します。対応しない形式は、別形式を誤った拡張子で保存せずエラーにします。
- Image Resizer: 倍率は0.01〜400%。入力欄と処理ロジックの下限を統一しています。Fitは指定枠に収まる実寸、Containは余白付きの指定寸法、Coverは中央を切り抜いた指定寸法です。
- Screenshot Decorator: 元画像の長辺を最大1,600pxに縮小し、余白を追加します。指定比率は整数の出力寸法でも厳密に保ちます。
- Code Shot: 10,000文字・120行・出力幅2,400pxまで。コードを実行せずテキストとして描画します。Tabは4スペース。日本語・絵文字の字体は端末のフォントに依存します。
- Favicon Maker: 文字・絵文字は1行4文字（書記素）まで。512pxの原稿から16 / 32 / 180 / 192 / 512pxのPNGと、16 / 32pxのPNGを含むICOを生成します。ZIPのmanifest・HTMLは配置例で、サイト名・色・パスは配信先に合わせて編集してください。
- OGP: 1,200×630px。タイトル・サブタイトルは各180文字まで。文字サイズを調整してタイトル3行・サブタイトル2行に収め、収まらない場合は省略せずエラーで案内します。
- QR: UTF-8で1,500バイト、128〜2,048px、誤り訂正M。余白4〜12モジュール、1モジュール2px以上。前景色は背景色より暗く、コントラスト比4.5以上。出力前に入力URLへアクセスしません。

## プライバシーと配信

入力・生成内容はReactのメモリ上だけで扱い、外部サーバーへ送信しません。
localStorageには `web-tools-box.theme` のテーマ選択だけを保存します。
Cache Storageにはアプリ本体のHTML・CSS・JS・manifest・アイコンを保存します。入力・生成結果・ファイル内容・画面URLのクエリは保存しません。
外部フォント・解析タグ・外部API・ログイン・DB・バックエンド・AI機能はありません。
Markdownのリンクを利用者がクリックした場合は、そのリンク先へ移動します。プレビューによる自動アクセスは行いません。

テキストコピーはClipboard APIを優先し、失敗時はブラウザ内のコピー処理にフォールバックします。
画像コピーはPNGとしてClipboard APIへ渡します。非対応・許可されない環境ではエラーを表示し、画像保存を利用できます。
保存はBlob / Object URLで行い、ダウンロード開始後にURLを解放します。
スライダー、ラジオ、ボタンは標準HTMLでキーボード操作に対応し、フォーカスを可視化しています。

`dist/`はルート`/`とサブディレクトリに静的配信できます。サブディレクトリで配信する場合は、`pnpm build --base /web-tools-box/`のように公開先のパスを指定します。
ビルド時にTool Registryから各ツールの`index.html`を生成し、`about/index.html`と`404.html`も出力します。React RouterのURL構成を維持したまま、静的ホスティングで直接アクセス・再読み込みができます。コピーやWeb Cryptoを使うためHTTPSで配信します。
開発・preview用サーバーは静的画面を配信するためのもので、ユーザー入力の受信・処理APIはありません。

### GitHub Pagesへの公開

公開先は[Tetoriapot/web-tools-box](https://github.com/Tetoriapot/web-tools-box)、サイトURLは[Web Tools Box](https://tetoriapot.github.io/web-tools-box/)です。

`.github/workflows/pages.yml`は`main`へのpush、またはGitHubのActions画面からの手動実行で動きます。実行環境はNode.js 24とpnpm 11.25.0です。ロックファイルに従って依存関係をインストールし、型・lint・単体テスト・ビルド・整形・ブラウザテストを確認します。すべて成功すると、GitHub Pages用のパスで再ビルドして`dist/`を公開します。GitHubのSettings → Pagesで、公開元を「GitHub Actions」に設定してください。

GitHub Pages相当の配信テストは`tests/e2e/pages.spec.ts`です。Viteの自動フォールバックを使わず、各ツールのHTML・末尾スラッシュへのリダイレクト・404を検査します。ブラウザでは画像保存、取り消し、オフライン、テーマ、キャッシュの保存先を確認します。

v0.8.1のローカル検証では、TypeScript・lint・整形・production build、単体236件、E2E 160件が成功しました。

プログラム・アイコンなどの静的ファイルだけを配信します。ユーザーが入力したファイルやテキストをGitHubへ送る処理はありません。service workerの範囲とキャッシュ名を公開先のパスごとに分け、同じドメイン上の別サイトのキャッシュを削除しない構成です。

設定は[GitHub Pagesの公式手順](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)と[Viteの公開手順](https://vite.dev/guide/static-deploy.html#github-pages)に基づいています。

### PWAとオフライン利用

1. `pnpm build` → `pnpm preview`、またはHTTPSの配信先で一度オンラインで開きます。
2. 「このサイトについて」の「オフラインで利用できます。」を確認します。
3. 接続を切っても、トップ・各ツールのURL直アクセス・再読み込み・コピー・保存が利用できます。まだ開いていないツールと、ZIP保存時だけ使うライブラリも準備対象です。

初回アクセス前にはオフラインで利用できません。プライベートモード、保存の拒否、空き容量不足、ブラウザによるキャッシュ削除などでも利用が制限されます。オンラインに戻ると、不足した静的ファイルの復旧を試みます。service worker非対応・登録失敗の場合も通常のツールは利用できます。

ホーム画面・アプリへの追加は対応ブラウザのメニューから行えます。独自のインストール要求や自動プロンプトは表示しません。開発サーバーではservice workerを登録しないため、PWA検証は本番ビルドのpreviewを使ってください。開発とpreviewは別ポートで利用します。

**更新方針:** 新しい版は全ファイルの保存完了後に待機します。作業中の自動再読み込みや強制切り替えは行いません。必要な結果をコピー・保存し、同じサイトのタブとインストールしたアプリのウィンドウをすべて閉じてから開くと更新されます。新しい版が有効になってから旧キャッシュを削除し、無関係なキャッシュには触れません。この動作は[service workerの標準ライフサイクル](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers#replacing_an_existing_service_worker)に従います。

**キャッシュ方針:** `scripts/pwa.ts` がビルド出力を列挙し、ファイル内容とworker原稿から版を生成します。SHA-256のintegrityを付けて同一オリジンの静的ファイルを一括取得し、欠落・途中配信・HTMLへの誤フォールバックはインストール失敗として旧版を維持します。実行中の任意のリクエストをキャッシュに追記する処理はありません。API・POST・外部URL・Blob・Data URLは対象外です。

配信時は次を設定してください。

- `sw.js`・`index.html`・`manifest.webmanifest`・`theme-init.js`・固定名アイコンは `Cache-Control: no-cache` 等で再検証可能にします。`sw.js` はJavaScript、manifestは `application/manifest+json` として配信します。
- `assets/` のハッシュ付きファイルは長期キャッシュ可能です。同一ビルドの `dist/` 全体を一括で切り替えてください。配信元やCDNによるHTML / JS / CSSの自動書き換えはintegrity不一致になるので無効にします。gzip / Brotli圧縮は利用できます。
- 古い版のアセットは移行期間中も配信元に残すと、キャッシュを失った旧タブが復旧しやすくなります。新しい版の待機中は、通常の再読み込みだけでは更新されません。
- サイトデータを消すと、オフライン用ファイルとテーマ選択も消えます。もう一度オンラインで準備してください。

アイコンは既存の `public/favicon.svg` から作成しています。変更時はChromium導入後に `pnpm icons` で192 / 512px、maskable 512px、Apple用180pxを再生成してからビルドします。maskableでは図柄を安全領域内に収めています。追加の実行時・開発用ライブラリはありません。

## 依存関係の理由

- **React / React DOM**: UIとコンポーネントの再利用。
- **React Router**: 同一URL体系、直接アクセス、ルートごとの表示。
- **yaml**: YAML 1.2構文解析・変換。TECH_SPECの推奨候補に代わり、構文木の検査とエイリアス展開量の上限指定ができる実装を選びました。[公式ドキュメント](https://eemeli.org/yaml/)
- **marked**: GFMの解析。自作パーサーを避け、表やコードブロックを一貫して扱います。[公式ドキュメント](https://marked.js.org/)
- **DOMPurify**: Markdownから生成されたHTMLの安全化。パーサーだけではXSSを防げないため、表示・コピー前に許可リストで処理します。[公式ドキュメント](https://github.com/cure53/DOMPurify)
- **qrcode**: QRの符号化・誤り訂正を実装済みのライブラリに任せ、同じマトリクスからPNG / SVGを内部生成します。[公式ドキュメント](https://github.com/soldair/node-qrcode)
- **JSZip**: favicon一式をブラウザ内でZIPにします。ZIP保存操作時にだけ読み込みます。[公式ドキュメント](https://stuk.github.io/jszip/documentation/api_jszip/generate_async.html)
- **Vite / TypeScript**: 開発・静的ビルド・型検査。
- **ESLint / Prettier**: 型付きコード・React Hooksの静的検査と整形。
- **Vitest / Testing Library / jsdom**: 変換ロジック、ブラウザAPI失敗時、UIのテスト。
- **Playwright / axe-core**: 実ブラウザでの主要操作、コピー・保存、表示、コントラスト・フォームラベル等の検証。開発用依存で、本番へは配信されません。
- **jsQR / @types/qrcode**: QR画像を独立した実装で読み取る検証と、qrcodeの型定義。開発用依存です。

画像処理は標準Canvas / File / Blob APIで行い、画像処理・エディタ・UIライブラリは追加していません。
Phase 3では新しいライブラリを追加せず、共通の入力・結果・保存コンポーネントを再利用しています。
Phase 4の追加はyaml・marked・DOMPurifyの3つです。ツールのlazy importに含め、トップ画面では読み込みません。Base64・ファイル読込・保存にはブラウザ標準APIを使います。
Phase 5の実行時依存の追加はqrcode・JSZipの2つです。画像の読込・寸法検証・描画・保存・コピーを共通化しています。ICOは[PNGを含むICO形式](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types)のコンテナを内部生成します。
Phase 6では依存を追加していません。画像の事前寸法検査は[PNG仕様](https://www.w3.org/TR/png-3/#11IHDR)、[libjpeg-turboのマーカー処理](https://github.com/libjpeg-turbo/libjpeg-turbo/blob/main/src/jdmarker.c)、[WebPコンテナ仕様](https://developers.google.com/speed/webp/docs/riff_container)に基づきます。画像全体のデコードと検証はブラウザ標準APIを使用します。
v0.7.1のHelp・更新情報には[標準のdialog要素](https://developer.mozilla.org/ja/docs/Web/HTML/Reference/Elements/dialog)を使用し、追加依存はありません。非対応の場合の表示・閉じる操作にも対応しています。
解決したバージョンは `pnpm-lock.yaml` で固定しています。

## 仕様の正本

- `PRODUCT_SPEC.md`: プロダクトの目的・原則・MVP全体像
- `UI_SPEC.md`: UI・アクセシビリティ・画面幅
- `TECH_SPEC.md`: 技術方針
- `TOOLS_20.md`: 全20ツールの仕様
- `FILE_STRUCTURE.md`: 推奨構成
- `TASKS.md`: Phaseごとの進行状況（実装順の正本）
- `tool-registry.example.json`: 元の登録データ例
- `PROMPT_FOR_CODEX.txt`: 元の実装指示

TASKS.mdのPhase 0〜7を完了しています。公開先へのデプロイは実施していません。
