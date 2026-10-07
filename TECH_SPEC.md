# TECH SPEC

## 1. 推奨スタック
- React
- TypeScript
- Vite
- React Router
- CSS Modules または Vanilla CSS + CSS Variables

UIライブラリは必須にしない。
依存を増やしすぎない。

## 2. 推奨ライブラリ
用途に応じて導入。
- jszip: ZIP生成
- file-saver: Blob保存補助
- html-to-image: DOM画像化
- qrcode: QR生成
- prettier: JSON整形補助（必要なら）
- monaco-editor または CodeMirror: コード入力
- fast-xml-parser: XML変換
- js-yaml: YAML変換

## 3. ローカル処理原則
- File API
- Canvas API
- Blob / Object URL
- SVG DOM
- Clipboard API
- Web Crypto
- localStorage

サーバーAPIはMVPでは使用しない。

## 4. データ保存
保存するもの:
- テーマ
- お気に入り（将来）
- 最近使ったツール（将来）
- 一部UI設定

保存しないもの:
- ユーザー投入画像本体
- JSON本文
- コード本文
- 個人情報

## 5. ルーティング
例:
- `/`
- `/tools/screenshot-decorator`
- `/tools/code-shot`
- `/tools/json-visualizer`

## 6. Tool Registry
各ツール情報を一元管理する。

```ts
export type ToolDefinition = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: 'image' | 'data' | 'svg-css' | 'text' | 'web';
  localOnly: boolean;
  keywords: string[];
  status: 'ready' | 'beta' | 'planned';
}
```

## 7. 共通コンポーネント
- AppShell
- Header
- ToolHeader
- ToolCard
- ToolGrid
- SearchBox
- CategoryTabs
- FileDropzone
- ColorField
- SliderField
- CodeEditor
- PreviewPanel
- CopyButton
- DownloadButton
- ResetButton
- Toast
- ErrorNotice
- LocalProcessingBadge

## 8. エラーハンドリング
- Error Boundary
- 変換処理try/catch
- Blob生成失敗時の通知
- 非対応ファイル形式の事前弾き
- ファイルサイズ上限の表示

## 9. セキュリティ
- 入力HTMLを直接dangerouslySetInnerHTMLしない
- SVG文字列の扱いに注意
- 外部URLプレビューはiframe sandbox
- Data URLのサイズ制限
- Object URLはrevokeする

## 10. パフォーマンス
- ツール単位lazy load
- 大型ライブラリdynamic import
- 画像処理は必要に応じてWeb Worker検討
- 画像プレビューは最大表示サイズ制限

## 11. テスト
- Vitest
- React Testing Library
- Playwright

最低限:
- ルーティング
- 主要入力
- コピー
- 保存
- 変換成功
- エラー表示
- モバイルUI

## 12. PWA
MVP後半で追加。
- manifest
- service worker
- offline shell
- install promptは強制しない
