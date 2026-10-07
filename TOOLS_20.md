# 初期ツール20種

## 01 Screenshot Decorator
### 目的
スクリーンショットをSNS・記事・ポートフォリオ向けに整える。
### 入力
PNG/JPEG/WebP
### 機能
- 背景色
- グラデーション
- 余白
- 角丸
- 影
- 枠線
- 比率 1:1 / 4:3 / 16:9 / auto
- PNG/WebP保存
### MVP
画像1枚のみ。

## 02 Code Shot
### 目的
コードや短文を美しい画像へ変換。
### 機能
- テーマ
- フォントサイズ
- 行番号
- padding
- 背景
- window風ヘッダーON/OFF
- PNG保存

## 03 JSON Visualizer
### 目的
JSONを読みやすく確認。
### 機能
- 構文検証
- 整形
- 圧縮
- ツリー表示
- 折り畳み
- キー検索
- pathコピー

## 04 Favicon Maker
### 目的
画像/文字/絵文字からfavicon一式生成。
### 出力
- favicon.ico
- 16x16
- 32x32
- 180x180
- 192x192
- 512x512
- manifest例
- ZIP

## 05 SVG Background Maker
### 目的
背景パターン作成。
### プリセット
- dots
- grid
- stripe
- diagonal
- checker
- triangle
- cross
- hex
### 出力
SVG / CSS background / Data URI

## 06 SVG Shape Maker
### 目的
セクション境界用SVG生成。
### 種類
- wave
- blob
- mountain
- curve
- zigzag
### 設定
高さ、複雑さ、色、反転、seed

## 07 OGP Image Maker
### 目的
ブログ・Webサービス用OGP作成。
### 機能
- 1200x630
- タイトル
- サブタイトル
- ロゴ
- 背景色/画像
- テンプレ6種
- PNG保存

## 08 QR Code Maker
### 目的
URL/テキストからQR生成。
### 機能
- サイズ
- margin
- foreground/background
- SVG/PNG保存

## 09 Gradient Maker
### 目的
CSSグラデーション作成。
### 種類
- linear
- radial
### 機能
- 複数stop
- angle
- CSSコピー

## 10 Box Shadow Maker
### 目的
box-shadowを視覚調整。
### 設定
x/y/blur/spread/color/inset
### 出力
CSSコピー

## 11 Border Radius Maker
### 目的
複雑なborder-radiusを生成。
### 機能
- 8値編集
- linked/unlinked
- blob風random
- CSSコピー

## 12 Clamp Calculator
### 目的
レスポンシブfont-size等のclamp生成。
### 入力
min/max px, min/max viewport
### 出力
clamp()

## 13 Base64 Converter
### 目的
テキスト/画像のBase64変換。
### 機能
- encode
- decode
- Data URL
- copy

## 14 URL Encode / Decode
### 目的
URL文字列変換。
### 機能
- encodeURIComponent
- decodeURIComponent
- query parser

## 15 UUID Generator
### 目的
UUID生成。
### 機能
- v4
- 1〜100件
- 改行/CSV形式
- 一括コピー

## 16 Text Case Converter
### 目的
文字列ケース変換。
### 種類
- camelCase
- PascalCase
- snake_case
- kebab-case
- CONSTANT_CASE
- Title Case

## 17 Markdown Preview
### 目的
Markdown即時プレビュー。
### 機能
- split view
- copy HTML
- download .md
- XSS安全化

## 18 JSON ↔ YAML Converter
### 目的
JSON/YAML相互変換。
### 機能
- syntax validation
- copy
- sample

## 19 Image Format Converter
### 目的
PNG/JPEG/WebP変換。
### 機能
- quality
- width/height
- keep aspect
- transparency注意表示

## 20 Image Resizer
### 目的
画像サイズ変更。
### 機能
- px/%
- aspect lock
- fit/contain/cover
- PNG/JPEG/WebP保存

---

# ツール共通仕様
全ツールに可能な限り以下を付ける。
- サンプル入力
- リセット
- コピー成功Toast
- Local処理表示
- 簡単な使い方
- キーボード操作
- URL直アクセス
- 空入力エラー
