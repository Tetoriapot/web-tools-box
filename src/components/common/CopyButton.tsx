import { useClipboard } from '../../hooks/useClipboard';
import { Button } from './Button';
import { Icon } from './Icon';

export function CopyButton({
  text,
  label = 'コピー',
  primary = true,
  disabled = false,
}: {
  text: string;
  label?: string;
  primary?: boolean;
  disabled?: boolean;
}) {
  const { copy, pending } = useClipboard();
  return (
    <Button
      onClick={() => void copy(text)}
      disabled={disabled || !text || pending}
      variant={primary ? 'primary' : 'secondary'}
    >
      <Icon name="copy" size={17} />
      {pending ? 'コピー中…' : label}
    </Button>
  );
}
