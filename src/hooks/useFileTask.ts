import { useEffect, useRef, useState } from 'react';
import { errorMessage } from '../lib/errors';

// Ignore an older read after another file, edit, reset, mode change or unmount.
export function useLocalTask<Input, Output>(
  read: (input: Input) => Promise<Output>,
  onLoaded: (value: Output) => void,
) {
  const generation = useRef(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  function cancel() {
    generation.current++;
    setBusy(false);
    setError('');
  }
  async function run(input: Input) {
    const current = ++generation.current;
    setError('');
    setBusy(true);
    try {
      const value = await read(input);
      if (current === generation.current) onLoaded(value);
    } catch (error) {
      if (current === generation.current) setError(errorMessage(error));
    } finally {
      if (current === generation.current) setBusy(false);
    }
  }
  function restoreError(message: string) {
    cancel();
    setError(message);
  }
  return { run, cancel, restoreError, busy, error };
}

export function useFileTask<T>(read: (file: File) => Promise<T>, onLoaded: (value: T) => void) {
  return useLocalTask(async (files: FileList | File[]) => {
    if (files.length !== 1 || !files[0]) throw new Error('ファイルは1つずつ選択してください。');
    return read(files[0]);
  }, onLoaded);
}
