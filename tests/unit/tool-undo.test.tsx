import { useState } from 'react';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { useToolUndo } from '../../src/hooks/useToolUndo';
import { ToolWorkspace } from '../../src/components/tools/ToolWorkspace';
import { SampleButton } from '../../src/components/common/SampleButton';
import { ResetButton } from '../../src/components/common/ResetButton';

it('keeps only the latest action snapshot and discards it after undo or unmount', () => {
  const { result, unmount } = renderHook(() => {
    const [value, setValue] = useState({ input: 'private', output: 'result', error: 'error' });
    return { value, history: useToolUndo(value, setValue), setValue };
  });
  const original = result.current.value;
  act(() =>
    result.current.history.perform('サンプル', () =>
      result.current.setValue({ input: 'sample', output: '', error: '' }),
    ),
  );
  const sample = result.current.value;
  act(() =>
    result.current.history.perform('リセット', () =>
      result.current.setValue({ input: '', output: '', error: '' }),
    ),
  );
  act(() => result.current.history.undo());
  expect(result.current.value).toEqual(sample);
  expect(result.current.history.label).toBeNull();
  act(() => result.current.history.undo());
  expect(result.current.value).not.toEqual(original);
  unmount();
  const next = renderHook(() => useToolUndo('another tool', () => {}));
  expect(next.result.current.label).toBeNull();
});

function Workspace() {
  const [input, setInput] = useState('original');
  const undo = useToolUndo(input, setInput);
  return (
    <ToolWorkspace
      undo={undo}
      tips="hint"
      controls={
        <>
          <label>
            入力
            <input value={input} onChange={(event) => setInput(event.target.value)} />
          </label>
          <SampleButton onClick={() => setInput('sample')}>サンプル</SampleButton>
          <ResetButton onClick={() => setInput('')} />
        </>
      }
    >
      <button>変換</button>
      <output>{input}</output>
    </ToolWorkspace>
  );
}

it('restores sample input, returns keyboard focus, and clears undo on subsequent edits/actions', () => {
  render(<Workspace />);
  const sample = screen.getByRole('button', { name: 'サンプル' });
  sample.focus();
  fireEvent.click(sample);
  const undo = screen.getByRole('button', { name: '元に戻す' });
  undo.focus();
  fireEvent.click(undo);
  expect(screen.getByLabelText('入力')).toHaveValue('original');
  expect(sample).toHaveFocus();
  fireEvent.click(sample);
  fireEvent.change(screen.getByLabelText('入力'), { target: { value: 'edited' } });
  expect(screen.queryByRole('button', { name: '元に戻す' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'リセット' }));
  fireEvent.click(screen.getByRole('button', { name: '変換' }));
  expect(screen.queryByRole('button', { name: '元に戻す' })).toBeNull();
});
