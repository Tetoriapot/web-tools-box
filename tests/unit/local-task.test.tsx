import { act, renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useLocalTask } from '../../src/hooks/useFileTask';

it('ignores a superseded result and a result after reset or unmount', async () => {
  const complete = new Map<string, (value: string) => void>();
  const read = (id: string) => new Promise<string>((resolve) => complete.set(id, resolve));
  const loaded = vi.fn();
  const { result, unmount } = renderHook(() => useLocalTask(read, loaded));
  act(() => {
    void result.current.run('old');
    void result.current.run('new');
  });
  await act(async () => {
    complete.get('old')!('old');
  });
  expect(loaded).not.toHaveBeenCalled();
  await act(async () => {
    complete.get('new')!('new');
  });
  expect(loaded).toHaveBeenCalledExactlyOnceWith('new');
  act(() => {
    void result.current.run('reset');
    result.current.cancel();
  });
  await act(async () => {
    complete.get('reset')!('reset');
  });
  expect(result.current.busy).toBe(false);
  act(() => {
    void result.current.run('unmount');
  });
  unmount();
  await act(async () => {
    complete.get('unmount')!('unmount');
  });
  expect(loaded).toHaveBeenCalledOnce();
});

it('reports file read failures and clears them on cancellation', async () => {
  const { result } = renderHook(() =>
    useLocalTask(async () => {
      throw new Error('読み込めません');
    }, vi.fn()),
  );
  await act(async () => {
    await result.current.run(undefined);
  });
  expect(result.current.error).toBe('読み込めません');
  act(() => result.current.cancel());
  expect(result.current.error).toBe('');
});

it('undo restores a prior error and cancels a pending task without restarting it', async () => {
  let finish!: (value: string) => void;
  const read = vi.fn(
    () =>
      new Promise<string>((resolve) => {
        finish = resolve;
      }),
  );
  const loaded = vi.fn();
  const { result } = renderHook(() => useLocalTask(read, loaded));
  act(() => {
    void result.current.run(undefined);
  });
  act(() => result.current.restoreError('元のエラー'));
  await act(async () => finish('late result'));
  expect(result.current.error).toBe('元のエラー');
  expect(result.current.busy).toBe(false);
  expect(read).toHaveBeenCalledOnce();
  expect(loaded).not.toHaveBeenCalled();
});
