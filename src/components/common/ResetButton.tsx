import { useContext } from 'react';
import { ToolUndoContext } from '../../hooks/useToolUndo';
import { Button } from './Button';
import { Icon } from './Icon';

export function ResetButton({ onClick }: { onClick: () => void }) {
  const history = useContext(ToolUndoContext);
  return (
    <Button
      data-undo-action="reset"
      onClick={() => (history ? history.perform('リセット', onClick) : onClick())}
      variant="quiet"
    >
      <Icon name="reset" size={17} />
      リセット
    </Button>
  );
}
