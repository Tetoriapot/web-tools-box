import { useId } from 'react';
import { FileDropzone } from './FileDropzone';
import { ErrorNotice } from './ErrorNotice';
import { IMAGE_ACCEPT } from '../../lib/local-files';
import { IMAGE_HINT, type LocalImage } from '../../lib/images';

export function ImageInput({
  input,
}: {
  input: {
    image: LocalImage | null;
    busy: boolean;
    error: string;
    load: (files: FileList) => void;
  };
}) {
  const errorId = useId();
  return (
    <>
      <FileDropzone
        accept={IMAGE_ACCEPT}
        hint={IMAGE_HINT}
        busy={input.busy}
        errorId={input.error ? errorId : undefined}
        onFiles={input.load}
      />
      <ErrorNotice message={input.error} id={errorId} />
      {input.image && (
        <p className="image-file-note">
          {input.image.name} · {input.image.canvas.width} × {input.image.canvas.height} px
        </p>
      )}
    </>
  );
}
