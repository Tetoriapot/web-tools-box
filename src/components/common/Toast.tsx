import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ToastContext, type ToastMessage } from '../../hooks/useToast';
import { Icon } from './Icon';

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<(ToastMessage & { id: number }) | null>(null);
  const notify = useCallback((text: string, kind: ToastMessage['kind'] = 'success') => {
    setMessage({ text, kind, id: Date.now() });
  }, []);
  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(null), 6000);
    return () => window.clearTimeout(timeout);
  }, [message]);
  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {message && (
          <div className={`toast toast-${message.kind}`}>
            <Icon name={message.kind === 'success' ? 'check' : 'shield'} />
            <span>{message.text}</span>
            <button
              type="button"
              className="icon-button"
              aria-label="通知を閉じる"
              onClick={() => setMessage(null)}
            >
              <Icon name="close" />
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
