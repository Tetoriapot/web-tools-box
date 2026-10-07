import { useToolUndo } from '../../hooks/useToolUndo';
import { SampleButton } from '../../components/common/SampleButton';
import { useId, useState } from 'react';
import { Button } from '../../components/common/Button';
import { CodeEditor } from '../../components/common/CodeEditor';
import { ErrorNotice } from '../../components/common/ErrorNotice';
import { FileDropzone } from '../../components/common/FileDropzone';
import { OptionGroup } from '../../components/common/OptionGroup';
import { ResetButton } from '../../components/common/ResetButton';
import { ResultPanel } from '../../components/tools/ResultPanel';
import { ToolWorkspace } from '../../components/tools/ToolWorkspace';
import { useFileTask, useLocalTask } from '../../hooks/useFileTask';
import { useToast } from '../../hooks/useToast';
import { errorMessage } from '../../lib/errors';
import { downloadBlob } from '../../lib/files';
import { IMAGE_ACCEPT } from '../../lib/local-files';
import {
  BASE64_TEXT_SAMPLE,
  decodeImage,
  decodeText,
  encodeImage,
  encodeText,
  sampleImageUri,
  type ImageResult,
} from './logic';
import styles from './styles.module.css';

export default function Base64Converter() {
  const errorId = useId();
  const [kind, setKind] = useState<'text' | 'image'>('text');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [dataUrl, setDataUrl] = useState(false);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [image, setImage] = useState<ImageResult | null>(null);
  const [error, setError] = useState('');
  const file = useFileTask(encodeImage, setImage);
  const decoder = useLocalTask(decodeImage, setImage);
  const notify = useToast();
  function clear() {
    file.cancel();
    decoder.cancel();
    setOutput('');
    setImage(null);
    setError('');
  }
  function edit(text: string) {
    clear();
    setInput(text);
  }
  function convert() {
    clear();
    if (kind === 'image') {
      void decoder.run(input);
      return;
    }
    try {
      setOutput(mode === 'encode' ? encodeText(input, dataUrl) : decodeText(input));
    } catch (error) {
      setError(errorMessage(error));
    }
  }
  function sample() {
    clear();
    if (kind === 'image') {
      try {
        const uri = sampleImageUri();
        setInput(mode === 'decode' ? uri : '');
        if (mode === 'encode') void decoder.run(uri);
      } catch (error) {
        setError(errorMessage(error));
      }
    } else setInput(mode === 'encode' ? BASE64_TEXT_SAMPLE : encodeText(BASE64_TEXT_SAMPLE, false));
  }
  const result = image ? (dataUrl ? image.url : image.base64) : output;
  const undo = useToolUndo(
    {
      kind,
      mode,
      dataUrl,
      input,
      output,
      image,
      error,
      fileError: file.error,
      decoderError: decoder.error,
    },
    (previous) => {
      setKind(previous.kind);
      setMode(previous.mode);
      setDataUrl(previous.dataUrl);
      setInput(previous.input);
      setOutput(previous.output);
      setImage(previous.image);
      setError(previous.error);
      file.restoreError(previous.fileError);
      decoder.restoreError(previous.decoderError);
    },
  );
  return (
    <ToolWorkspace
      undo={undo}
      controls={
        <>
          <div className="panel-heading">
            <h2>入力と変換</h2>
          </div>
          <OptionGroup
            label="データの種類"
            value={kind}
            onChange={(kind) => {
              setKind(kind);
              edit('');
            }}
            options={[
              { id: 'text', label: 'テキスト' },
              { id: 'image', label: '画像' },
            ]}
          />
          <OptionGroup
            label="変換方法"
            value={mode}
            onChange={(mode) => {
              setMode(mode);
              edit('');
            }}
            options={[
              { id: 'encode', label: 'エンコード' },
              { id: 'decode', label: 'デコード' },
            ]}
          />
          {kind === 'image' && mode === 'encode' ? (
            <FileDropzone
              accept={IMAGE_ACCEPT}
              hint="PNG / JPEG / WebP · 2 MiB / 1,600万画素まで"
              busy={file.busy || decoder.busy}
              errorId={file.error ? errorId : undefined}
              onFiles={(files) => {
                clear();
                void file.run(files);
              }}
            />
          ) : (
            <>
              <CodeEditor
                label={mode === 'encode' ? 'テキスト' : 'Base64またはData URL'}
                value={input}
                onChange={(event) => edit(event.target.value)}
                rows={12}
                hint={
                  mode === 'encode'
                    ? 'UTF-8 · 100,000文字まで。'
                    : '標準Base64。改行・空白・末尾の=省略に対応。デコード結果はテキスト100,000文字 / 画像2 MiBまで。'
                }
                aria-invalid={!!error || !!decoder.error}
                aria-describedby={error || decoder.error ? errorId : undefined}
              />
              <Button
                variant="primary"
                className="full-width"
                disabled={decoder.busy}
                onClick={convert}
              >
                {mode === 'encode' ? 'エンコードする' : 'デコードする'}
              </Button>
            </>
          )}
          {mode === 'encode' && (
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={dataUrl}
                onChange={(event) => {
                  setDataUrl(event.target.checked);
                  if (kind === 'text') {
                    setOutput('');
                    setError('');
                  }
                }}
              />
              Data URLで出力する
            </label>
          )}
          {decoder.busy && <p role="status">画像を確認しています…</p>}
          <ErrorNotice message={error || file.error || decoder.error} id={errorId} />
          <div className="secondary-actions">
            <SampleButton variant="quiet" onClick={sample}>
              サンプル
            </SampleButton>
            <ResetButton
              onClick={() => {
                setKind('text');
                setMode('encode');
                setDataUrl(false);
                edit('');
              }}
            />
          </div>
        </>
      }
      tips={
        <p>
          日本語・絵文字はUTF-8で変換します。画像は元ファイルのバイト列を保持します。デコードした画像は表示して保存できます。Base64は暗号化ではありません。SVGやHTMLを画像として読み込むことはありません。
        </p>
      }
    >
      {image && (
        <section className="panel">
          <div className="panel-heading">
            <h2>画像プレビュー</h2>
            <span>
              {image.width} × {image.height} px
            </span>
          </div>
          <div className={styles.stage}>
            <img src={image.url} alt="Base64画像のプレビュー" />
          </div>
          <p className="field-hint">
            {image.mime} · {image.bytes.length.toLocaleString()} バイト
          </p>
          <Button
            onClick={() => {
              try {
                downloadBlob(
                  new Blob([new Uint8Array(image.bytes)], { type: image.mime }),
                  `decoded.${image.mime === 'image/jpeg' ? 'jpg' : image.mime.split('/')[1]}`,
                );
                notify('保存を開始しました');
              } catch (error) {
                notify(errorMessage(error), 'error');
              }
            }}
          >
            画像を保存
          </Button>
        </section>
      )}
      {!(kind === 'image' && mode === 'decode') && (
        <ResultPanel
          text={result}
          filename={mode === 'decode' ? 'decoded.txt' : 'base64.txt'}
          title={mode === 'decode' ? 'テキスト' : 'Base64'}
        />
      )}
      {kind === 'image' && mode === 'decode' && !image && (
        <section className="panel">
          <div className="panel-heading">
            <h2>画像プレビュー</h2>
          </div>
          <p>Base64を入力して、デコードしてください。</p>
        </section>
      )}
    </ToolWorkspace>
  );
}
