import { useId, useRef, type ReactNode } from 'react';
import { ToolUndoContext, type ToolUndo } from '../../hooks/useToolUndo';
import { Button } from '../common/Button';

export function ToolWorkspace({
  controls,
  children,
  tips,
  undo,
}: {
  controls: ReactNode;
  children: ReactNode;
  tips: ReactNode;
  undo: ToolUndo;
}) {
  const id = useId();
  const controlsRef = useRef<HTMLElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  function jump(target: HTMLElement | null) {
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  return (
    <ToolUndoContext.Provider value={undo}>
      <nav className="workspace-jumps" aria-label="作業エリアの移動">
        <a
          className="button"
          href={`#${id}-controls`}
          onClick={(event) => {
            event.preventDefault();
            jump(controlsRef.current);
          }}
        >
          入力・設定へ
        </a>
        <a
          className="button"
          href={`#${id}-result`}
          onClick={(event) => {
            event.preventDefault();
            jump(resultRef.current);
          }}
        >
          結果へ
        </a>
      </nav>
      <div
        className="workspace"
        // Clear history after the field's own change handler has consumed its new value.
        onChange={undo.forget}
        onDrop={undo.forget}
        onClick={(event) => {
          const button = event.target instanceof Element ? event.target.closest('button') : null;
          if (button && !button.hasAttribute('data-undo-action')) undo.forget();
        }}
      >
        <section
          className="panel controls-panel"
          ref={controlsRef}
          id={`${id}-controls`}
          tabIndex={-1}
          aria-label="入力・設定"
        >
          {controls}
          <div className="undo-notice" aria-live="polite" aria-atomic="true">
            {undo.label && (
              <>
                <span>{undo.label}の直前に戻せます。</span>
                <Button data-undo-action="undo" onClick={undo.undo}>
                  元に戻す
                </Button>
              </>
            )}
          </div>
        </section>
        <div
          className="workspace-result"
          ref={resultRef}
          id={`${id}-result`}
          tabIndex={-1}
          role="region"
          aria-label="出力結果"
        >
          {children}
        </div>
      </div>
      <section className="tool-tips">
        <h2>使い方のヒント</h2>
        <div>{tips}</div>
      </section>
    </ToolUndoContext.Provider>
  );
}
