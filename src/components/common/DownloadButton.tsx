import { useDownload } from '../../hooks/useDownload';
import { Button } from './Button';
import { Icon } from './Icon';

export function DownloadButton({
  text,
  filename,
  type,
  disabled = false,
}: {
  text: string;
  filename: string;
  type?: string;
  disabled?: boolean;
}) {
  const download = useDownload();
  return (
    <Button onClick={() => download(text, filename, type)} disabled={disabled || !text}>
      <Icon name="download" size={17} />
      保存
    </Button>
  );
}
