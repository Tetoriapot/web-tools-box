import { Link } from 'react-router-dom';
import { categories, type ToolDefinition } from '../../data/tools';
import { Icon } from '../common/Icon';
import { LocalProcessingBadge } from '../common/LocalProcessingBadge';

function ToolArtwork({ tool }: { tool: ToolDefinition }) {
  return (
    <div className={`tool-art art-${tool.id}`} aria-hidden="true">
      {tool.id === 'uuid-generator' ? (
        <div className="uuid-art">
          <span>550e8400–e29b</span>
          <strong>41d4–a716</strong>
          <span>446655440000</span>
          <i>UUID v4</i>
        </div>
      ) : tool.id === 'url-encoder' ? (
        <div className="url-art">
          <span>こんにちは</span>
          <b>⇅</b>
          <code>%E3%81%93</code>
        </div>
      ) : tool.id === 'text-case-converter' ? (
        <div className="case-art">
          <span>hello world</span>
          <strong>
            helloWorld
            <span className="art-caret" />
          </strong>
        </div>
      ) : tool.id === 'gradient-maker' ? (
        <div className="gradient-art">
          <span />
          <span />
          <span />
        </div>
      ) : tool.id === 'box-shadow-maker' ? (
        <div className="shadow-art" />
      ) : tool.id === 'border-radius-maker' ? (
        <div className="radius-art" />
      ) : tool.id === 'clamp-calculator' ? (
        <div className="clamp-art">
          <span>Aa</span>
          <span>Aa</span>
          <span>Aa</span>
        </div>
      ) : tool.id === 'svg-background-maker' ? (
        <div className="pattern-art" />
      ) : tool.id === 'svg-shape-maker' ? (
        <svg className="shape-art" viewBox="0 0 220 90">
          <path d="M0 90V40C35 0 65 85 105 45S175 5 220 45V90Z" fill="#a3a7cb" />
          <path d="M0 90V63C45 25 80 95 135 58S195 48 220 63V90Z" fill="#737da5" />
        </svg>
      ) : tool.id === 'json-visualizer' ? (
        <div className="data-art">
          <span>{'{ project: … }'}</span>
          <strong>▾ tools</strong>
          <span>▸ name: …</span>
        </div>
      ) : tool.id === 'json-yaml-converter' ? (
        <div className="data-art">
          <span>{'{ "local": true }'}</span>
          <strong>JSON ⇄ YAML</strong>
          <span>local: true</span>
        </div>
      ) : tool.id === 'base64-converter' ? (
        <div className="data-art">
          <span>こんにちは</span>
          <strong>⇅ Base64</strong>
          <span>44GT44KT44Gr…</span>
        </div>
      ) : tool.id === 'markdown-preview' ? (
        <div className="data-art">
          <span># 小さな制作ノート</span>
          <strong>Markdown</strong>
          <span>書いて、すぐ確認。</span>
        </div>
      ) : tool.category === 'image' ? (
        <div className="image-tool-art">
          <div className={`image-art-symbol image-art-${tool.id}`}>
            {tool.id === 'favicon-maker' ? 'W' : tool.mark}
          </div>
          <span>
            {tool.id === 'ogp-image-maker'
              ? '1200 × 630'
              : tool.id === 'code-shot'
                ? 'code → image'
                : tool.id === 'image-format-converter'
                  ? 'PNG / JPEG / WebP'
                  : tool.id === 'image-resizer'
                    ? 'ピクセル・割合でサイズ変更'
                    : tool.id === 'favicon-maker'
                      ? '16 · 32 · 180 · 192 · 512'
                      : '背景・余白・角丸を設定'}
          </span>
        </div>
      ) : tool.id === 'qr-code-maker' ? (
        <div className="data-art">
          <span>URL / TEXT</span>
          <strong>▦ QR Code</strong>
          <span>SVG + PNG</span>
        </div>
      ) : (
        <span className="art-symbol">{tool.mark}</span>
      )}
    </div>
  );
}

export function ToolCard({ tool }: { tool: ToolDefinition }) {
  const planned = tool.status === 'planned';
  return (
    <Link to={`/tools/${tool.slug}`} className={`tool-card ${planned ? 'planned' : ''}`}>
      <ToolArtwork tool={tool} />
      <div className="tool-card-body">
        <div className="card-category">
          <span>{categories.find((category) => category.id === tool.category)?.label}</span>
          {planned ? (
            <span className="planned-label">準備中</span>
          ) : (
            <LocalProcessingBadge compact />
          )}
        </div>
        <h3>{tool.japaneseName}</h3>
        <span className="tool-card-english" lang="en">
          {tool.name}
        </span>
        <p>{tool.description}</p>
        <div className="card-bottom">
          <span>{planned ? 'ツールの紹介を見る' : 'ツールを開く'}</span>
          <Icon name="arrow" size={18} />
        </div>
      </div>
    </Link>
  );
}
