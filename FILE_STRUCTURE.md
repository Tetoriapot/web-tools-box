# FILE STRUCTURE

```text
web-tools-box/
├─ public/
│  ├─ icons/
│  ├─ manifest.webmanifest
│  └─ favicon.svg
├─ src/
│  ├─ app/
│  │  ├─ App.tsx
│  │  ├─ router.tsx
│  │  └─ providers.tsx
│  ├─ components/
│  │  ├─ layout/
│  │  │  ├─ AppShell.tsx
│  │  │  ├─ Header.tsx
│  │  │  └─ ToolLayout.tsx
│  │  ├─ common/
│  │  │  ├─ Button.tsx
│  │  │  ├─ CopyButton.tsx
│  │  │  ├─ DownloadButton.tsx
│  │  │  ├─ FileDropzone.tsx
│  │  │  ├─ ColorField.tsx
│  │  │  ├─ SliderField.tsx
│  │  │  ├─ Toast.tsx
│  │  │  └─ ErrorNotice.tsx
│  │  └─ tools/
│  ├─ data/
│  │  └─ tools.ts
│  ├─ hooks/
│  │  ├─ useClipboard.ts
│  │  ├─ useDownload.ts
│  │  └─ useTheme.ts
│  ├─ lib/
│  │  ├─ canvas.ts
│  │  ├─ files.ts
│  │  ├─ strings.ts
│  │  ├─ svg.ts
│  │  └─ validators.ts
│  ├─ pages/
│  │  ├─ HomePage.tsx
│  │  └─ NotFoundPage.tsx
│  ├─ tools/
│  │  ├─ screenshot-decorator/
│  │  │  ├─ ScreenshotDecorator.tsx
│  │  │  ├─ logic.ts
│  │  │  └─ styles.module.css
│  │  ├─ code-shot/
│  │  ├─ json-visualizer/
│  │  ├─ favicon-maker/
│  │  ├─ svg-background-maker/
│  │  ├─ svg-shape-maker/
│  │  ├─ ogp-image-maker/
│  │  ├─ qr-code-maker/
│  │  ├─ gradient-maker/
│  │  ├─ box-shadow-maker/
│  │  ├─ border-radius-maker/
│  │  ├─ clamp-calculator/
│  │  ├─ base64-converter/
│  │  ├─ url-encoder/
│  │  ├─ uuid-generator/
│  │  ├─ text-case-converter/
│  │  ├─ markdown-preview/
│  │  ├─ json-yaml-converter/
│  │  ├─ image-format-converter/
│  │  └─ image-resizer/
│  ├─ styles/
│  │  ├─ tokens.css
│  │  ├─ global.css
│  │  └─ utilities.css
│  └─ main.tsx
├─ tests/
│  ├─ e2e/
│  └─ unit/
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
└─ README.md
```

## 原則
- 各ツールのロジックをUIから分離
- 共通処理をlibへ寄せる
- 1ツール巨大ファイル禁止
- ツール固有CSSはそのフォルダ内
- Tool Registryからトップ一覧を自動生成
