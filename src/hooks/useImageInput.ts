import { useState } from 'react';
import { useFileTask } from './useFileTask';
import { readImage, sampleImage, type LocalImage } from '../lib/images';
import { errorMessage } from '../lib/errors';

export function useImageInput(onLoad?: (image: LocalImage) => void) {
  const [image, setImage] = useState<LocalImage | null>(null);
  const [sampleError, setSampleError] = useState('');
  const file = useFileTask(readImage, (image) => {
    setImage(image);
    onLoad?.(image);
  });
  function clear() {
    file.cancel();
    setImage(null);
    setSampleError('');
  }
  return {
    snapshot: { image, error: file.error || sampleError },
    restore: (snapshot: { image: LocalImage | null; error: string }) => {
      file.cancel();
      setImage(snapshot.image);
      setSampleError(snapshot.error);
    },
    image,
    busy: file.busy,
    error: file.error || sampleError,
    load: (files: FileList) => {
      clear();
      void file.run(files);
    },
    sample: () => {
      clear();
      try {
        const image = sampleImage();
        setImage(image);
        onLoad?.(image);
      } catch (error) {
        setSampleError(errorMessage(error));
      }
    },
    clear,
  };
}
