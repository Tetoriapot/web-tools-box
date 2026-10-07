import { useCallback, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const storageKey = 'web-tools-box.theme';

function savedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(storageKey);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [preference, setPreference] = useState<Theme | null>(savedTheme);
  const [system, setSystem] = useState<Theme>(systemTheme);
  const theme = preference ?? system;

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    const onChange = () => setSystem(systemTheme());
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null) setPreference(savedTheme());
    };
    media?.addEventListener('change', onChange);
    window.addEventListener('storage', onStorage);
    return () => {
      media?.removeEventListener('change', onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggle = useCallback(() => {
    const next = theme === 'light' ? 'dark' : 'light';
    setPreference(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      /* This tab still supports theme changes when storage is blocked. */
    }
  }, [theme]);
  return { theme, toggle };
}
