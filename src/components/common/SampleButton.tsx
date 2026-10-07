import { useContext, type ComponentProps } from 'react';
import { ToolUndoContext } from '../../hooks/useToolUndo';
import { Button } from './Button';

export function SampleButton({ onClick, ...props }: ComponentProps<typeof Button>) {
  const history = useContext(ToolUndoContext);
  return (
    <Button
      {...props}
      data-undo-action="sample"
      onClick={(event) => {
        if (history) history.perform('サンプル', () => onClick?.(event));
        else onClick?.(event);
      }}
    />
  );
}
