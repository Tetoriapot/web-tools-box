import { createContext, useRef, useState } from 'react';

export type ToolUndo = {
  label: string | null;
  perform: (label: string, action: () => void) => void;
  undo: () => void;
  forget: () => void;
};
export const ToolUndoContext = createContext<ToolUndo | null>(null);

// A single immutable snapshot, owned by this tool. Never persisted or shared across routes.
export function useToolUndo<T>(value: T, restore: (previous: T) => void): ToolUndo {
  const [previous, setPrevious] = useState<{ value: T; label: string } | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  return {
    label: previous?.label ?? null,
    perform(label, action) {
      trigger.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setPrevious({ value, label });
      action();
    },
    undo() {
      if (!previous) return;
      restore(previous.value);
      setPrevious(null);
      if (trigger.current?.isConnected) trigger.current.focus();
    },
    forget() {
      setPrevious(null);
    },
  };
}
