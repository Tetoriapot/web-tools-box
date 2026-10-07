import { downloadText } from '../lib/files';
import { errorMessage } from '../lib/errors';
import { useToast } from './useToast';

export function useDownload() {
  const notify = useToast();
  return (text: string, filename: string, type?: string) => {
    try {
      downloadText(text, filename, type);
      notify('保存を開始しました');
    } catch (error) {
      notify(errorMessage(error), 'error');
    }
  };
}
