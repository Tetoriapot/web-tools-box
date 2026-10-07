import { useState } from 'react';
import { copyText } from '../lib/clipboard';
import { errorMessage } from '../lib/errors';
import { useToast } from './useToast';

export function useClipboard() {
  const [pending, setPending] = useState(false);
  const notify = useToast();
  async function copy(text: string) {
    if (pending) return;
    setPending(true);
    try {
      await copyText(text);
      notify('コピーしました');
    } catch (error) {
      notify(errorMessage(error), 'error');
    } finally {
      setPending(false);
    }
  }
  return { copy, pending };
}
