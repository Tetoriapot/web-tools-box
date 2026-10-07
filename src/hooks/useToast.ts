import { createContext, useContext } from 'react';

export type ToastMessage = { text: string; kind: 'success' | 'error' };
export const ToastContext = createContext<(text: string, kind?: ToastMessage['kind']) => void>(
  () => {},
);
export function useToast() {
  return useContext(ToastContext);
}
